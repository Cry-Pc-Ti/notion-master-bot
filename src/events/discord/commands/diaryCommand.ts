import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ApplicationCommandOptionChoiceData,
} from 'discord.js';
import { queryDiaryPage } from '../../notion/queryPage/queryDiaryPage';
import { updateDiary } from '../../notion/updatePage/updateDiaryPage';
import { createDiaryMessage } from '../embeds/createEmbeds';
import { DiaryData } from '../../../types/original/notion';
import { insertDiary } from '../../notion/insertPage/insertDiaryPage';
import { getJsonData } from '../../notion/getJsonData';
import { diaryTagId } from '../../../modules/notionModule';

export const diaryCommand = {
  data: new SlashCommandBuilder()
    .setName('diary')
    .setDescription('Write Notion Diary')
    .addStringOption((option) =>
      option
        .setName('date')
        .setDescription('Set Date')
        .addChoices(
          {
            name: 'Today',
            value: 'today',
          },
          {
            name: 'Yesterday',
            value: 'yesterday',
          },
          {
            name: 'Day Before Yesterday',
            value: 'dby',
          }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('happiness')
        .setDescription('Set Happiness')
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('lookback').setDescription('Write Lookback').setRequired(true)
    ),

  async autocomplete(interaction: AutocompleteInteraction) {
    // optionの情報を取得
    const forcusedOption = interaction.options.getFocused(true);

    // optionがtagの場合
    if (forcusedOption.name === 'happiness') {
      // Autocompleteの情報を取得
      const autocompleteChoice: ApplicationCommandOptionChoiceData[] = [];

      // 重複を確認するためのセット
      const addedFolder: Set<string> = new Set();

      // NotionLibraryのデータを取得
      const jsonData = getJsonData();

      // DiaryフォルダのページIDを取得
      const diaryFolderPageId: string | undefined = jsonData.Folder.SubFolder.find(
        (folder) => folder.FolderName === 'Diary'
      )?.PageId;

      // サブフォルダページがDiaryのタグを取得
      for (const diaryTag of jsonData.Tag) {
        if (
          diaryFolderPageId &&
          diaryTag.MasterFolder.SubFolder.PageId &&
          diaryTag.MasterFolder.SubFolder.PageId.includes(diaryFolderPageId)
        ) {
          const pageId = diaryTag.PageId;

          // TagNameから「.Thiking.Diary.」を除外
          const tagName: string = diaryTag.TagName.split('.').pop() as string;

          if (!addedFolder.has(tagName)) {
            autocompleteChoice.push({ name: tagName, value: pageId });
            addedFolder.add(tagName);
          }
        }

        // autocompleteChoiceを降順に並び替え
        autocompleteChoice.sort((a, b) => {
          if (a.name < b.name) return 1;
          if (a.name > b.name) return -1;
          return 0;
        });
      }

      // Autocompleteを登録
      await interaction.respond(autocompleteChoice);
    }
  },

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      const { options } = interaction;

      // コマンドに入力された値を取得
      const relativDate: string | null = options.getString('date');
      const happiness: string | null = options.getString('happiness');
      const lookback: string | null = options.getString('lookback');

      if (!relativDate || !happiness || !lookback) {
        await interaction.editReply('処理が失敗しました');
        return;
      }

      // DiaryタグのページIDを取得
      const diaryData: DiaryData = {
        relativDate: relativDate,
        happiness: { tagName: '', tagId: happiness },
        lookback: lookback,
        date: '',
        tagId: diaryTagId,
        pageId: '',
        notionPageUrl: '',
      };

      // happinesのTagIdからTagNameを取得
      const jsonData = getJsonData();
      const tagName = jsonData.Tag.find((tag) => tag.PageId === happiness)?.TagName;
      diaryData.happiness.tagName = tagName as string;

      // 相対日付をもとにPageID, URLを取得
      await queryDiaryPage(diaryData);

      // Notionに該当のページが無い場合、処理終了
      if (!diaryData.pageId || !diaryData.notionPageUrl) {
        await interaction.editReply('処理が失敗しました');
        return;
      }

      // 該当のページを更新
      await updateDiary(diaryData);

      // 埋め込みメッセージを作成
      const embeds = createDiaryMessage.update(diaryData);

      // メッセージを送信
      await interaction.editReply(embeds);
    } catch (error) {
      await interaction.editReply('処理が失敗しました');
      console.error(`Command Error: ${error}`);
    }
  },

  // １週間分の日記ページを作成(毎週日曜日に実行)
  async createDiaryPage() {
    // 月曜から日曜までの1週間分の日記ページを作成
    for (let i = 0; i < 7; i++) {
      const date = new Date(new Date().setDate(new Date().getDate() + i + 1))
        .toISOString()
        .split('T')[0];

      // 曜日を取得
      const dayOfWeek = new Date(date).toDateString().split(' ')[0];

      // 日記ページを作成
      await insertDiary(date, dayOfWeek, diaryTagId);
    }
    console.log('Diary Page Created');
  },
};
