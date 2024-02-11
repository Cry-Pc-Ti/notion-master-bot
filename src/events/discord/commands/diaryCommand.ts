import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { queryDiaryPage } from '../../notion/queryPage/queryDiaryPage';
import { updateDiary } from '../../notion/updatePage/updateDiaryPage';
import { createDiaryMessage } from '../embeds/createEmbeds';
import { DiaryData } from '../../../types/original/notion';
import { insertDiary } from '../../notion/insertPage/insertDiaryPage';

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
        .addChoices(
          {
            name: '★★★★★',
            value: '0aff3cbc-9b40-4727-ab8b-7c94b5d1667d',
          },
          {
            name: '★★★★',
            value: '9a48163b-bfb1-45bc-a314-749bf502350d',
          },
          {
            name: '★★★',
            value: 'f8316e13-e347-4473-b4d7-18fc33edd88a',
          },
          {
            name: '★★',
            value: '093f3a55-53da-4f4c-b988-73c5c7c3e997',
          },
          {
            name: '★',
            value: '6f0851c2-0aea-45d8-9921-74c86569ae48',
          }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('lookback').setDescription('Write Lookback').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      const { options } = interaction;

      // コマンドに入力された値を取得
      const relativDate: string | null = options.getString('date');
      const happiness: string | null = options.getString('happiness');
      const lookback: string | null = options.getString('lookback');

      if (!relativDate || !happiness || !lookback) return;

      // DiaryタグのページIDを取得
      const diaryTagId: string = '776bc3253a04467eae4c9f4dcc186b3d';

      const diaryData: DiaryData = {
        relativDate: relativDate,
        happiness: happiness,
        lookback: lookback,
        date: '',
        tagId: diaryTagId,
        pageId: '',
        notionPageUrl: '',
      };

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
      const embeds = createDiaryMessage.update(diaryData.date, diaryData.notionPageUrl);

      // メッセージを送信
      await interaction.editReply(embeds);
    } catch (error) {
      await interaction.editReply('処理が失敗しました');
      console.error(`Command Error: ${error}`);
    }
  },

  // １週間分の日記ページを作成(毎週日曜日に実行)
  async createDiaryPage() {
    const diaryTagId: string = '776bc325-3a04-467e-ae4c-9f4dcc186b3d';

    // 月曜から日曜までの1週間分の日記ページを作成
    for (let i = 0; i < 7; i++) {
      const date = new Date(new Date().setDate(new Date().getDate() + i + 1))
        .toISOString()
        .split('T')[0];

      // 曜日を取得
      const dayOfWeek = new Date(date).toDateString().split(' ')[0];

      console.log(date, dayOfWeek);

      // 日記ページを作成
      await insertDiary(date, dayOfWeek, diaryTagId);
    }
    console.log('Diary Page Created');
  },
};
