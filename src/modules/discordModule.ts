// 必要なモジュールをインポート
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

// ENVファイルの読込み
dotenv.config();

const token: string = process.env.BOT_TOKEN!;
const clientId: string = process.env.CLIENT_ID!;
const guildId: string = process.env.GUILD_ID!;
const channelId: string = process.env.CHANNEL_ID!;

const discord = new Client({
  intents: [GatewayIntentBits.Guilds],
});

export { token, clientId, guildId, channelId, discord };
