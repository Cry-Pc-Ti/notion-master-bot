// モジュールをインポート
import {
  Interaction,
  REST,
  Routes,
  clientId,
  discord,
  guildId,
  token,
} from './modules/discordModule';
import * as cron from 'node-cron';

import { saveNotionLibraryData } from './notion/saveNotionLibraryData';

// 登録コマンドを呼び出してリスト形式で登録
import { memoCommand } from './discord/commands/memoCommand';
import { taskCommand } from './discord/commands/taskCommand';
import { diaryCommand } from './discord/commands/diaryCommand';
import { clipCommand } from './discord/commands/clipCommand';

// const commands = [memoCommand.data, taskCommand.data, diaryCommand.data, clipCommand.data];
const commands = [clipCommand.data];

// Discordサーバーにコマンドを登録
const rest = new REST({ version: '10' }).setToken(token);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
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

discord.on('interactionCreate', async (interaction: Interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === clipCommand.data.name) {
      await clipCommand.selectTag(interaction);
    }
  }

  let masterFolderPageId: string = 'a';

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'masterFolder') {
      masterFolderPageId = interaction.values[0];
    }
  }

  // if (interaction.isChatInputCommand()) {
  //   if (interaction.commandName === clipCommand.data.name) {
  //     await clipCommand.selectSubFolder(interaction, masterFolderPageId);
  //   }
  // }

  // if (interaction.isAutocomplete()) {
  //   // memoコマンドのAutoCompleteをセット
  //   if (interaction.commandName === memoCommand.data.name) {
  //     await memoCommand.autocomplete(interaction);

  //     // taskコマンドのAutoCompleteをセット
  //   } else if (interaction.commandName === taskCommand.data.name) {
  //     await taskCommand.autoComplete(interaction);
  //   }
  // }

  // if (interaction.isChatInputCommand()) {
  //   // memoコマンドを実行
  //   if (interaction.commandName === memoCommand.data.name) {
  //     await memoCommand.execute(interaction);

  //     // taskコマンドを実行
  //   } else if (interaction.commandName === taskCommand.data.name) {
  //     await taskCommand.execute(interaction);

  //     // diaryコマンドを実行
  //   } else if (interaction.commandName === diaryCommand.data.name) {
  //     await diaryCommand.execute(interaction);

  //     // clipコマンドを実行
  //   } else if (interaction.commandName === clipCommand.data.name) {
  //     await clipCommand.execute(interaction);
  //   }
  // }
});

// 毎日8:00と18:00にタスクを表示
// discord.once('ready', () => {
//   cron.schedule('0 0 8,18 * * *', async () => {
//     const channel = discord.channels.cache.get(channelId);
//     if (channel) await taskCommand.schedule(channel);
//   });
// });

// 6時間ごとにNotionライブラリのデータを更新
// cron.schedule('0 */6 * * *', async () => {
//   try {
//     await saveNotionLibraryData();
//   } catch (error: unknown) {
//     console.error('Notionライブラリの更新中にエラーが発生しました:', error);
//   }
// });

// ログイン
discord.login(token);
