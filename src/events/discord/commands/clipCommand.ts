import {
  SlashCommandBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ApplicationCommandOptionChoiceData,
  ActionRowBuilder,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { insertClip } from '../../notion/insertPage/insertClipPage';
import { createClipMessage } from '../message/createEmbed';
import { ClipData } from '../../../types/original/notion';
import { getJsonData } from '../../notion/libraryData/getJsonData';
import { isValidUrl } from '../../common/isValidationUrl';
import { fetchWebPageData } from '../../common/fetchWebPageData';
import { documentPageIconUrl } from '../../../modules/notionModule';

export const clipCommand = {
  // コマンドを定義
  data: new SlashCommandBuilder()
    .setName('clip')
    .setDescription('Clip Reference')
    .addStringOption((option) =>
      option.setName('folder').setDescription('Set Folder').setAutocomplete(true).setRequired(true)
    )
    .addStringOption((option) => option.setName('url').setDescription('Set URL').setRequired(true))
    .addBooleanOption((option) => option.setName('favorite').setDescription('Set Favorite'))
    .toJSON(),

  // AutoCompleteの登録
  async autocomplete(interaction: AutocompleteInteraction) {
    // optionの情報を取得
    const forcusedOption = interaction.options.getFocused(true);

    // optionがtagの場合
    if (forcusedOption.name === 'folder') {
      // Autocompleteの情報を取得
      const autocompleteChoice: ApplicationCommandOptionChoiceData[] = [];

      // 重複を確認するためのセット
      const addedFolder: Set<string> = new Set();

      // NotionLibraryのデータを取得
      const jsonData = getJsonData();

      // マスタフォルダページIDがInputのサブフォルダを取得
      const subFolderPageIds: string[] | undefined = jsonData.Folder.MasterFolder.find(
        (folder) => folder.FolderName === 'Input'
      )?.SubFolderPageId;

      // 取得したサブフォルダのページIDからサブフォルダの名前とぺージIDを取得
      if (subFolderPageIds) {
        for (const subFolderPageId of subFolderPageIds) {
          const subFolder = jsonData.Folder.SubFolder.find(
            (folder) => folder.PageId === subFolderPageId
          );
          if (subFolder && !addedFolder.has(subFolder.FolderName)) {
            autocompleteChoice.push({
              name: subFolder.FolderName,
              value: subFolder.PageId,
            });
            addedFolder.add(subFolder.FolderName);
          }
        }
      }

      // Autocompleteを登録
      await interaction.respond(autocompleteChoice);
    }
  },

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.deferReply();
    }

    // optionの情報を取得
    const subFolderPageId = interaction.options.getString('folder');
    const url = interaction.options.getString('url');
    let favorite = interaction.options.getBoolean('favorite');

    // 必須項目が取得できない場合、処理を終了
    if (!subFolderPageId || !url) {
      await interaction.editReply('処理が失敗しました');
      return;
    }

    // 入力された文字列がURL出ない場合、処理を終了

    if (!isValidUrl(url)) {
      await interaction.editReply('URLが無効です');
      return;
    }

    // favariteの入力がない場合、値をfalseにする
    if (!favorite) favorite = false;

    const clipData: ClipData = {
      faviconUrl: '',
      notionPageUrl: '',
      title: null,
      siteUrl: url,
      tag: [],
      favorite: favorite,
    };

    const webPageData = await fetchWebPageData(clipData.siteUrl);

    // タイトルが取得できない場合、処理を終了
    if (!webPageData.title) {
      await interaction.editReply('処理が失敗しました');
      return;
    }

    clipData.title = webPageData.title;
    clipData.faviconUrl = webPageData.faviconUrl ?? documentPageIconUrl;

    // NotionLibraryのデータを取得
    const jsonData = getJsonData();

    // InputフォルダのページIDを取得
    const inputFolderPageId: string | undefined = jsonData.Folder.MasterFolder.find(
      (folder) => folder.FolderName === 'Input'
    )?.PageId;

    // InputフォルダのページIDが取得できない場合、処理を終了
    if (!inputFolderPageId) {
      await interaction.editReply('処理が失敗しました');
      return;
    }

    // 取得したサブフォルダに含まれているタグを取得
    const matchingTags = jsonData.Tag.filter(
      (tag) =>
        tag.MasterFolder.PageId === inputFolderPageId &&
        tag.MasterFolder.SubFolder.PageId === subFolderPageId
    );

    // タグが取得できない場合、処理を終了
    if (!matchingTags.length) {
      await interaction.editReply('処理が失敗しました');
      return;
    }

    // タグの数を取得
    const tagCount = matchingTags.length;

    // セレクトメニューを作成
    const tagSelectMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
      .setCustomId('tag')
      .setPlaceholder('Select Tag')
      .setMinValues(1)
      .setMaxValues(tagCount)
      .addOptions(matchingTags.map((tag) => ({ label: tag.TagName, value: tag.PageId })));

    // セレクトメニューを送信
    const row: ActionRowBuilder<StringSelectMenuBuilder> =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(tagSelectMenu);

    const selectResponse = await interaction.editReply({ components: [row] });

    // セレクトメニューで選択された値を取得
    const tagCollector = selectResponse.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (selectMenuInteraction) => selectMenuInteraction.user.id === interaction.user.id,
    });

    tagCollector.on('collect', async (selectMenuInteraction: StringSelectMenuInteraction) => {
      // セレクトメニューで選択されたタグのページIDを取得
      clipData.tag = selectMenuInteraction.values.map((value) => ({
        name: jsonData.Tag.find((tag) => tag.PageId === value)?.TagName || '',
        id: value,
      }));

      // Notionにページを挿入
      await insertClip(clipData);

      // 埋め込みメッセージを作成・送信
      const embed = createClipMessage.insert(clipData);
      if (embed) await interaction.editReply(embed);
    });
  },
};
