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
import { insertClip } from '../../notion/insert/insertClipPage';
import { createSaveMessage } from '../createEmbedMessage';

export const clipCommand = {
  // コマンドを定義
  data: new SlashCommandBuilder()
    .setName('clip')
    .setDescription('Clip Reference')
    .addStringOption((option) => option.setName('url').setDescription('Set URL').setRequired(true))
    // .addStringOption((option) =>
    //   option
    //     .setName('category')
    //     .setDescription('Set Category')
    //     .setAutocomplete(true)
    //     .setRequired(true)
    // )
    // .addStringOption((option) => option.setChoices().setAutocomplete(true).setRequired(true))
    .addBooleanOption((option) =>
      option.setName('favorite').setDescription('Set Favorite').setRequired(true)
    )
    .toJSON(),

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
