import * as fs from 'fs';
import {
  SlashCommandBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Channel,
  ChannelType,
  ApplicationCommandOptionChoiceData,
} from '../../modules/discordModule';
import { fetchTitleAndFavicon } from '../../notion/fetchTitleAndFavicon';
import { insertClip } from '../../notion/insertPage/insertClipPage';
import { createSaveMessage } from '../createEmbedMessage';
import { NotionLibraryData } from '../../modules/notionModule';
import {
  ActionRowBuilder,
  ActionRowData,
  ComponentType,
  Interaction,
  InteractionCollector,
  InteractionResponse,
  Options,
  SelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
} from 'discord.js';

export const clipCommand = {
  // コマンドを定義
  data: new SlashCommandBuilder()
    .setName('clip')
    .setDescription('Clip Reference')
    .addStringOption((option) => option.setName('url').setDescription('Set URL').setRequired(true))
    .addBooleanOption((option) =>
      option.setName('favorite').setDescription('Set Favorite').setRequired(true)
    )
    // .addStringOption((option) =>
    //   option
    //     .setName('master tag')
    //     .setDescription('Select Folder')
    //     .setAutocomplete(true)
    //     .setRequired(true)
    // )
    .toJSON(),

  async selectTag(interaction: ChatInputCommandInteraction) {
    // JSONファイルの読み込み
    const fileData = fs.readFileSync('notion-data.json', 'utf-8');

    // JSONデータをオブジェクトに変換
    const jsonData: NotionLibraryData = JSON.parse(fileData);

    const masterFolderChoice: { label: string; value: string }[] = [];

    for (const folder of jsonData.Folder) {
      const masterFolderName = folder.MasterFolder.FolderName;
      const masterFolderPageId = folder.MasterFolder.PageId;

      masterFolderChoice.push({ label: masterFolderName, value: masterFolderPageId });
    }

    const select: StringSelectMenuBuilder = new StringSelectMenuBuilder()
      .setCustomId('masterFolder')
      .setPlaceholder('Select Master Folder')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        masterFolderChoice.map((masterFolderChoice) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(masterFolderChoice.label)
            .setValue(masterFolderChoice.value)
        )
      );

    const row: ActionRowBuilder<StringSelectMenuBuilder> =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

    const reply: InteractionResponse = await interaction.reply({ components: [row] });

    const collector: InteractionCollector<StringSelectMenuInteraction> =
      reply.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        filter: (i) => i.user.id === interaction.user.id && i.customId === interaction.id,
        // time: 60_000,
      });

    collector.on('collect', (interaction: StringSelectMenuInteraction) => {
      console.log(interaction.values);
      if (!interaction.values.length) return;

      interaction.reply(interaction.values[0]);
    });
  },

  // コマンド実行時の処理
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      const { options } = interaction;

      // コマンドに入力された値を取得
      const siteUrl: string | null = options.getString('url');
      const favorite: boolean | null = options.getBoolean('favorite');
      console.log(siteUrl, favorite);

      if (!siteUrl || favorite === null) {
        await interaction.editReply('処理が失敗しました');
        return;
      }

      // URLをもとにサイトのタイトルとファビコンを取得
      const siteData = await fetchTitleAndFavicon(siteUrl);
      console.log(siteData);

      // タイトルとファビコンのどちらかが取得できない場合、処理を終了
      if (!siteData.title || !siteData.faviconUrl) {
        await interaction.editReply('処理が失敗しました');
        return;
      }

      const title = siteData.title;
      const faviconUrl = siteData.faviconUrl;

      // 該当のページを更新
      await insertClip(faviconUrl, title, siteUrl, favorite);

      // 埋め込みメッセージを作成
      // const embedMsg = createSaveMessage.clip();

      // メッセージを送信
      // await interaction.editReply({ embeds: [embedMsg] });
      await interaction.editReply('OK');
    } catch (error: unknown) {
      await interaction.editReply('処理が失敗しました');
      console.error(error);
    }
  },
};
