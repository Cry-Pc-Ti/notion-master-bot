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
import { createMemoMessage } from '../embeds/createEmbeds';
import { jsonData } from '../../notion/readJson';

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
        .addStringOption((option) => option.setName('body').setDescription('Set Body'))
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

    // optionがtagの場合
    if (forcusedOption.name === 'folder') {
      // Autocompleteの情報を取得
      const autocompleteChoice: ApplicationCommandOptionChoiceData[] = [];

      // 重複を確認するためのセット
      const addedFolder: Set<string> = new Set();

      // MemoフォルダのページIDを取得
      const memoFolderPageId: string | undefined = jsonData.Folder.SubFolder.find(
        (folder) => folder.FolderName === 'Memo'
      )?.PageId;

      // サブフォルダページIDがMemoのマスタフォルダを取得
      for (const masterFolder of jsonData.Folder.MasterFolder) {
        if (
          memoFolderPageId &&
          masterFolder.SubFolderPageId &&
          masterFolder.SubFolderPageId.includes(memoFolderPageId)
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
    await interaction.deferReply();
    try {
      const { options } = interaction;
      const subCommand = options.getSubcommand();

      // メモ追加処理
      if (subCommand === 'add') {
        // コマンドに入力された値を取得
        const title: string | null = options.getString('title');
        const body: string | null = options.getString('body');
        const masterFolderPageId: string | null = options.getString('folder');

        // 必須項目が入力されていない場合、処理終了
        if (!masterFolderPageId || !title) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // メモフォルダのページIDを取得
        const memoFolderPageId: string | undefined = jsonData.Folder.SubFolder.find(
          (folder) => folder.FolderName === 'Memo'
        )?.PageId;

        // メモフォルダのページIDが取得できない場合、処理を終了
        if (!memoFolderPageId) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // 取得したマスタフォルダに含まれているタグを取得
        const matchingTags = jsonData.Tag.filter(
          (tag) =>
            tag.MasterFolder.PageId === masterFolderPageId &&
            tag.MasterFolder.SubFolder.PageId === memoFolderPageId
        );

        // セレクトメニューを作成
        const tagSelectMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
          .setCustomId('tag')
          .setPlaceholder('Select Tag')
          .addOptions(matchingTags.map((tag) => ({ label: tag.TagName, value: tag.PageId })));

        // セレクトメニューを送信
        const row: ActionRowBuilder<StringSelectMenuBuilder> =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(tagSelectMenu);

        const selectResponse = await interaction.editReply({ components: [row] });

        // セレクトメニューで選択された値を取得
        const collector = selectResponse.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          filter: (selectMenuInteraction) => selectMenuInteraction.user.id === interaction.user.id,
        });

        collector.on('collect', async (selectMenuInteraction: StringSelectMenuInteraction) => {
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

        // メモフォルダのページIDを取得
        const memoFolderPageId: string | undefined = jsonData.Folder.SubFolder.find(
          (folder) => folder.FolderName === 'Memo'
        )?.PageId;

        // 必須項目が入力されていない場合、処理終了
        if (!memoFolderPageId) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // 取得したマスタフォルダに含まれているタグを取得
        const matchingTags = jsonData.Tag.filter(
          (tag) =>
            tag.MasterFolder.PageId === masterFolderPageId &&
            tag.MasterFolder.SubFolder.PageId === memoFolderPageId
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
        const collector = selectResponse.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          filter: (selectMenuInteraction) => selectMenuInteraction.user.id === interaction.user.id,
        });

        collector.on('collect', async (selectMenuInteraction: StringSelectMenuInteraction) => {
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
    } catch (error: unknown) {
      await interaction.editReply('処理が失敗しました');
      console.error(error);
    }
  },
};
