import {
  SlashCommandBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ApplicationCommandOptionChoiceData,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
  StringSelectMenuInteraction,
} from 'discord.js';
import { insertMemo } from '../../notion/insertPage/insertMemoPage';
import { queryMemoPage } from '../../notion/queryPage/queryMemoPage';
import { fetchRelationName } from '../../notion/queryPage/fetchRelationName';
import { createMemoMessage } from '../message/createEmbed';
import { loadJsonData } from '../../notion/libraryData/loadJsonData';

export const memoCommand = {
  // スラッシュコマンドの定義
  data: new SlashCommandBuilder()
    .setName('memo')
    .setDescription('Control Notion Memo')
    .addSubcommand((command) =>
      command
        .setName('add')
        .setDescription('Add Memo')
        .addStringOption((option) =>
          option
            .setName('folder')
            .setDescription('Select Folder')
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('title').setDescription('Set Title').setRequired(true)
        )
        // .addStringOption((option) => option.setName('body').setDescription('Set Body'))
        .addBooleanOption((option) => option.setName('body').setDescription('Set Body'))
    )
    .addSubcommand((command) =>
      command
        .setName('search')
        .setDescription('Search Memo')
        .addStringOption((option) =>
          option
            .setName('folder')
            .setDescription('Select Folder')
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addStringOption((option) => option.setName('query').setDescription('Set Query'))
    )
    .toJSON(),

  // AutoCompleteの登録
  async autocomplete(interaction: AutocompleteInteraction) {
    // optionの情報を取得
    const forcusedOption = interaction.options.getFocused(true);

    // optionがfolderの場合
    if (forcusedOption.name === 'folder') {
      // Autocompleteの情報を取得
      const autocompleteChoice: ApplicationCommandOptionChoiceData[] = [];

      // 重複を確認するためのセット
      const addedFolder: Set<string> = new Set();

      // NotionLibraryのデータを取得
      const jsonData = loadJsonData();

      // OutputフォルダのページIDを取得
      const outputFolderPageId: string | undefined = jsonData.Folder.SubFolder.find(
        (folder) => folder.FolderName === 'Output'
      )?.PageId;

      // サブフォルダページIDがOutputのマスタフォルダを取得
      for (const masterFolder of jsonData.Folder.MasterFolder) {
        if (
          outputFolderPageId &&
          masterFolder.SubFolderPageId &&
          masterFolder.SubFolderPageId.includes(outputFolderPageId)
        ) {
          const folderName = masterFolder.FolderName;
          const pageId = masterFolder.PageId;

          if (!addedFolder.has(folderName)) {
            autocompleteChoice.push({ name: folderName, value: pageId });
            addedFolder.add(folderName);
          }
        }
      }

      // Autocompleteを登録
      await interaction.respond(autocompleteChoice);
    }
  },

  // 各コマンドの処理
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.replied && !interaction.deferred) await interaction.deferReply();
    try {
      const { options } = interaction;
      const subCommand = options.getSubcommand();

      // メモ追加処理
      if (subCommand === 'add') {
        // コマンドに入力された値を取得
        const masterFolderPageId: string | null = options.getString('folder');
        const title: string | null = options.getString('title');
        const body: string | null = options.getString('body');

        // 必須項目が入力されていない場合、処理終了
        if (!masterFolderPageId || !title) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // NotionLibraryのデータを取得
        const jsonData = loadJsonData();

        // メモフォルダのページIDを取得
        const outputFolderPageId: string | undefined = jsonData.Folder.SubFolder.find(
          (folder) => folder.FolderName === 'Output'
        )?.PageId;

        // メモフォルダのページIDが取得できない場合、処理を終了
        if (!outputFolderPageId) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // 取得したマスタフォルダに含まれているタグを取得
        const matchingTags = jsonData.Tag.filter(
          (tag) =>
            tag.MasterFolder.PageId === masterFolderPageId &&
            tag.MasterFolder.SubFolder.PageId === outputFolderPageId
        );

        // セレクトメニューを作成
        const tagSelectMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
          .setCustomId('tag')
          .setPlaceholder('Select Tag')
          .setMinValues(1)
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
          const selectedTagId = selectMenuInteraction.values[0];

          // Notionに新規ページを追加
          const insertPageData = await insertMemo(selectedTagId, title, body);

          // 選択されたタグの名前を取得
          insertPageData.tagName = await fetchRelationName(selectedTagId);

          // 埋め込みメッセージを作成・送信
          const embed = createMemoMessage.add(insertPageData);
          await interaction.editReply(embed);
        });

        // メモ検索処理
      } else if (subCommand === 'search') {
        // コマンドに入力された値を取得
        const masterFolderPageId: string | null = options.getString('folder');
        const query: string | null = options.getString('query');

        if (!masterFolderPageId) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // NotionLibraryのデータを取得
        const jsonData = loadJsonData();

        // OutputフォルダのページIDを取得
        const outputFolderPageId: string | undefined = jsonData.Folder.SubFolder.find(
          (folder) => folder.FolderName === 'Output'
        )?.PageId;

        // 必須項目が入力されていない場合、処理終了
        if (!outputFolderPageId) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // 取得したマスタフォルダに含まれているタグを取得
        const matchingTags = jsonData.Tag.filter(
          (tag) =>
            tag.MasterFolder.PageId === masterFolderPageId &&
            tag.MasterFolder.SubFolder.PageId === outputFolderPageId
        );

        // セレクトメニューを作成
        const tagSelectMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
          .setCustomId(interaction.id)
          .setPlaceholder('Select Tag')
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
          const selectedTagId = selectMenuInteraction.values[0];

          // Notionから対象ページを検索
          const queryMemoData = await queryMemoPage(selectedTagId, query);

          if (!queryMemoData || !queryMemoData.length) {
            interaction.editReply('指定の検索条件では見つかりませんでした');
            return;
          }

          // 埋め込みメッセージを作成・送信
          const embed = createMemoMessage.search(queryMemoData);
          await interaction.editReply(embed);
        });
      }
    } catch (error) {
      await interaction.editReply('処理が失敗しました');
      console.error(error);
    }
  },
};
