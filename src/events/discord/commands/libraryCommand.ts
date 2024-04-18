import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { saveNotionLibraryData } from '../../notion/libraryData/saveNotionLibraryData';

// コマンドを定義
export const libraryCommand = {
  data: new SlashCommandBuilder()
    .setName('library')
    .setDescription("Update Notion Library (It'll take some time)")
    .toJSON(),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.replied && !interaction.deferred) await interaction.deferReply();

    await interaction.editReply('Updating Library...');

    await saveNotionLibraryData();

    await interaction.editReply('Library Updated!');
  },
};
