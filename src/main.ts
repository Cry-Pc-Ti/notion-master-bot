// モジュールをインポート
import * as cron from 'node-cron';
import { ChannelType, Interaction, REST, Routes } from 'discord.js';
import { clientId, guildId, channelId, discord, token } from './modules/discordModule';

// コマンドをインポート
import { clipCommand } from './events/discord/commands/clipCommand';
import { diaryCommand } from './events/discord/commands/diaryCommand';
import { memoCommand } from './events/discord/commands/memoCommand';
import { libraryCommand } from './events/discord/commands/libraryCommand';
import { taskCommand } from './events/discord/commands/taskCommand';

// サーバーにコマンドを登録
const rest = new REST({ version: '10' }).setToken(token);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: [
        clipCommand.data,
        diaryCommand.data,
        memoCommand.data,
        libraryCommand.data,
        taskCommand.data,
      ],
    });
    console.log('サーバー固有のコマンドが登録されました');
  } catch (error) {
    console.error('コマンドの登録中にエラーが発生しました：', error);
  }
})();

// クライアントオブジェクトが準備完了時に実行
discord.once('ready', () => {
  console.log(`準備が完了しました ${discord.user?.tag}がログインします`);
});

// コマンドのオブジェクトを登録
const commands = {
  [clipCommand.data.name]: clipCommand,
  [diaryCommand.data.name]: diaryCommand,
  [memoCommand.data.name]: memoCommand,
  [libraryCommand.data.name]: libraryCommand,
  [taskCommand.data.name]: taskCommand,
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
      } catch (error) {
        console.error(`コマンド実行中にエラーが発生しました。: ${error}`);
        await interaction.reply('処理が失敗しました');
      }
    }
  }

  // AutoCompleteの登録
  if (interaction.isAutocomplete()) {
    try {
      if (interaction.commandName === clipCommand.data.name) {
        await clipCommand.autocomplete(interaction);
      } else if (interaction.commandName === memoCommand.data.name) {
        await memoCommand.autocomplete(interaction);
      } else if (interaction.commandName === taskCommand.data.name) {
        await taskCommand.autocomplete(interaction);
      }
    } catch (error) {
      console.error(`Autocompleteの登録中にエラーが発生しました。: ${error}`);
    }
  }
});

// 毎日7:00と16:00にタスクを表示
discord.once('ready', () => {
  cron.schedule('0 0 7,16 * * *', async () => {
    try {
      const channel = discord.channels.cache.get(channelId);
      if (channel) await taskCommand.sendTaskList(channel);
    } catch (error) {
      console.error(`タスクの表示中にエラーが発生しました: ${error}`);
    }
  });
});

// 1週間ごとに日記のページを作成
cron.schedule('0 0 0 * * 1', async () => {
  try {
    const channel = discord.channels.cache.get(channelId);

    // 日記ページを作成
    await diaryCommand.createDiaryPage();

    if (channel && channel.type === ChannelType.GuildText)
      await channel.send("This Week's Diary Page Created.");
  } catch (error) {
    console.error(`日記ページの作成中にエラーが発生しました: ${error}`);
  }
});

// ログイン
discord.login(token);
