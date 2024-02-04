import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { queryDiaryPage } from '../../notion/queryPage/queryDiaryPage';
import { updateDiary } from '../../notion/updatePage/updateDiaryPage';
import { createDiaryMessage } from '../embeds/createEmbeds';

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
      const diaryTagId = '776bc325-3a04-467e-ae4c-9f4dcc186b3d';

      // コマンドに入力された値を取得
      const relativDate: string | null = options.getString('date');
      const happiness: string | null = options.getString('happiness');
      const lookback: string | null = options.getString('lookback');

      if (!relativDate || !happiness || !lookback) return;

      // 相対日付をもとにPageID, URLを取得
      const pageData = await queryDiaryPage(relativDate, diaryTagId);

      // Notionに該当のページが無い場合、処理終了
      if (!pageData) {
        await interaction.editReply('処理が失敗しました');
        return;
      }

      // 該当ページから情報取得
      const date: string = pageData.date;
      const pageId: string = pageData.pageId;
      const url: string = pageData.url;

      // 該当のページを更新
      await updateDiary(pageId, diaryTagId, happiness, lookback);

      // 埋め込みメッセージを作成
      const embeds = createDiaryMessage.update(date, url);

      // メッセージを送信
      await interaction.editReply(embeds);
    } catch (error: unknown) {
      await interaction.editReply('処理が失敗しました');
      console.error(error);
    }
  },
};
