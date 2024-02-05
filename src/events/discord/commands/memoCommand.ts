import {
  SlashCommandBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  ApplicationCommandOptionChoiceData,
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
          option.setName('title').setDescription('Set Title').setRequired(true)
        )
        .addStringOption((option) => option.setName('body').setDescription('Set Body'))
        .addStringOption((option) =>
          option
            .setName('folder')
            .setDescription('Select folder')
            .setAutocomplete(true)
            .setRequired(true)
        )
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
        const masterFolderId: string | null = options.getString('folder');

        console.log(title, body, masterFolderId);

        // タイトルかタグがnullの場合、処理を中断
        if (!masterFolderId || !title) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // ページを作成
        const insertPageData = await insertMemo(masterFolderId, title, body);

        // タグ名を取得
        const tagName = await fetchRelationName(masterFolderId);
        insertPageData.tagName = tagName;

        // 埋め込みメッセージを作成
        const embedMsg = createMemoMessage.insert(insertPageData);

        // メッセージを送信
        await interaction.editReply({ embeds: [embedMsg] });

        // メモ検索処理
      } else if (subCommand === 'search') {
        const masterFolderId: string | null = options.getString('folder');
        const query: string | null = options.getString('query');

        if (!masterFolderId) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // ページを検索
        const memoData = await queryMemoPage(masterFolderId, query);

        if (!memoData || !memoData.length) {
          interaction.editReply('指定の検索条件では見つかりませんでした');
          return;
        }

        // 埋め込みメッセージを作成
        const embedMsg = createMemoMessage.search(memoData);
        await interaction.editReply({ embeds: [embedMsg] });
      }
    } catch (error: unknown) {
      await interaction.editReply('処理が失敗しました');
      console.error(error);
    }
  },
};
