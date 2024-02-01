// モジュールをインポート
import {
  Interaction,
  REST,
  Routes,
  clientId,
  guildId,
  channelId,
  discord,
  token,
} from './modules/discordModule';
import * as cron from 'node-cron';

import { saveNotionLibraryData } from './notion/saveNotionLibraryData';

// コマンドをインポート
import { memoCommand } from './discord/commands/memoCommand';
import { taskCommand } from './discord/commands/taskCommand';
import { diaryCommand } from './discord/commands/diaryCommand';
// import { clipCommand } from './discord/commands/clipCommand';

// サーバーにコマンドを登録
const rest = new REST({ version: '10' }).setToken(token);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: [
        memoCommand.data,
        taskCommand.data,
        diaryCommand.data,
        // clipCommand.data
      ],
    });
    console.log('サーバー固有のコマンドが登録されました');
  } catch (error: unknown) {
    console.error('コマンドの登録中にエラーが発生しました：', error);
  }
})();

// クライアントオブジェクトが準備完了時に実行
discord.once('ready', () => {
  console.log(`準備が完了しました ${discord.user?.tag}がログインします`);
});

// コマンドのオブジェクトを登録
const commands = {
  [memoCommand.data.name]: memoCommand,
  [taskCommand.data.name]: taskCommand,
  [diaryCommand.data.name]: diaryCommand,
  // [clipCommand.data.name]: clipCommand,
};

// クライアントオブジェクトが準備完了時に実行
discord.on('interactionCreate', async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    // コマンド名を取得
    const command = commands[interaction.commandName];

    // コマンドが存在する場合、実行
    if (command) {
      try {
        await command.execute(interaction);
      } catch (error: unknown) {
        console.error(error);
        await interaction.reply('処理が失敗しました');
      }
    }
  }

  // AutoCompleteの登録
  if (interaction.isAutocomplete()) {
    if (interaction.commandName === taskCommand.data.name) {
      await taskCommand.autocomplete(interaction);
    }
  }
});

// // 毎日8:00と18:00にタスクを表示
// discord.once('ready', () => {
//   cron.schedule('0 0 8,18 * * *', async () => {
//     const channel = discord.channels.cache.get(channelId);
//     if (channel) await taskCommand.schedule(channel);
//   });
// });

// // 6時間ごとにNotionライブラリのデータを更新
// cron.schedule('0 */6 * * *', async () => {
//   try {
//     await saveNotionLibraryData();
//   } catch (error: unknown) {
//     console.error('Notionライブラリの更新中にエラーが発生しました:', error);
//   }
// });

// ログイン
discord.login(token);
