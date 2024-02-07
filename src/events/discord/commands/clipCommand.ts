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
import { fetchTitleAndFavicon } from '../../fetchTitleAndFavicon';
import { insertClip } from '../../notion/insertPage/insertClipPage';
import { createClipMessage } from '../embeds/createEmbeds';
import { ClipData } from '../../../types/original/notion';
import { jsonData } from '../../notion/readJson';

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
    await interaction.deferReply();

    // optionの情報を取得
    const subFolderPageId = interaction.options.getString('folder');
    const url = interaction.options.getString('url');
    let favorite = interaction.options.getBoolean('favorite');

    // 必須項目が取得できない場合、処理を終了
    if (!subFolderPageId || !url) {
      await interaction.editReply('処理が失敗しました');
      return;
    }

    if (!favorite) favorite = false;

    const clipData: ClipData = {
      faviconUrl: '',
      notionUrl: '',
      title: '',
      siteUrl: url,
      tagId: [],
      favorite: favorite,
    };

    // InputフォルダのページIDを取得
    const inputFolderPageId: string | undefined = jsonData.Folder.MasterFolder.find(
      (folder) => folder.FolderName === 'Input'
    )?.PageId;

    // タスクフォルダのページIDが取得できない場合、処理を終了
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
    const collector = selectResponse.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (selectMenuInteraction) => selectMenuInteraction.user.id === interaction.user.id,
    });

    collector.on('collect', async (selectMenuInteraction: StringSelectMenuInteraction) => {
      // セレクトメニューで選択されたタグのページIDを取得
      clipData.tagId = selectMenuInteraction.values.map((value) => ({
        id: value,
      }));

      // URLからタイトルとfaviconの取得
      await fetchTitleAndFavicon(clipData);

      // タイトルとfaviconが取得できない場合、処理を終了
      if (!clipData.faviconUrl) {
        await interaction.editReply('処理が失敗しました');
        return;
      }

      // タイトルとfaviconの取得できた場合、Notionにページを挿入
      await insertClip(clipData);

      // 埋め込みメッセージを作成・送信
      const embed = createClipMessage.insert(clipData);
      await interaction.editReply(embed);
    });
  },
};
