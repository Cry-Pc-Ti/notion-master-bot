import {
  SlashCommandBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from '../../modules/discordModule';
import { insertMemo } from '../../notion/insert/insertMemoPage';
import { queryMemoPage } from '../../notion/query/queryMemoPage';
import { fetchRelationName } from '../../notion/fetchRelationName';
import { createMemoMessage } from '../createEmbedMessage';
import { queryAutoCompleteChoice } from '../../notion/query/autoComplete/createAutoComplete';

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
          option.setName('tag').setDescription('Select Tag').setAutocomplete(true).setRequired(true)
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
            .setName('category')
            .setDescription('Select Category')
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
    if (forcusedOption.name === 'tag') {
      // AutoCompleteの情報を取得
      const autoCompleteChoice = queryAutoCompleteChoice('subFolder', 'Memo');
      // autocompleteを登録
      await interaction.respond(autoCompleteChoice);

      // optionがcategoryの場合
    } else if (forcusedOption.name === 'category') {
      // AutoCompleteの情報を取得
      const autoCompleteChoice = queryAutoCompleteChoice('masterFolder', 'Memo');
      // autocompleteを登録
      await interaction.respond(autoCompleteChoice);
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
        const tagId: string | null = options.getString('tag');
        const title: string | null = options.getString('title');
        const body: string | null = options.getString('body');

        // タイトルかタグがnullの場合、処理を中断
        if (!tagId || !title) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // ページを作成
        const insertPageData = await insertMemo(tagId, title, body);

        // タグ名を取得
        const tagName = await fetchRelationName(tagId);
        insertPageData.tagName = tagName;

        // 埋め込みメッセージを作成
        const embedMsg = createMemoMessage.insert(insertPageData);

        // メッセージを送信
        await interaction.editReply({ embeds: [embedMsg] });

        // メモ検索処理
      } else if (subCommand === 'search') {
        const folderId: string | null = options.getString('category');
        const query: string | null = options.getString('query');

        if (!folderId) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // ページを検索
        const memoData = await queryMemoPage(folderId, query);

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
