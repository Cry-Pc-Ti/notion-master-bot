import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { saveNotionLibraryData } from '../../notion/saveNotionLibraryData';

export const libraryCommand = {
  // コマンドを定義
  data: new SlashCommandBuilder()
    .setName('library')
    .setDescription("Update Notion Library (It'll take some time)")
    .toJSON(),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    await interaction.editReply('Updating Library...');

    await saveNotionLibraryData();

    await interaction.editReply('Library Updated!');
  },
};
