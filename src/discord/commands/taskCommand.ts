import {
  SlashCommandBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Channel,
  ChannelType,
} from '../../modules/discordModule';
import { queryTask } from '../../notion/queryPage/queryTaskPage';
import { updateTask } from '../../notion/updatePage/updateTaskPage';
import { insertTask } from '../../notion/insertPage/insertTaskPage';
import { createTaskMessage } from '../createEmbedMessage';
import { fetchRelationName } from '../../notion/fetchRelationName';
import { queryAutoCompleteChoice } from '../autoComplete/createAutoComplete';

export const taskCommand = {
  // スラッシュコマンドの定義
  data: new SlashCommandBuilder()
    .setName('task')
    .setDescription('Control Notion Task')
    .addSubcommand(
      (command) =>
        command
          .setName('list')
          .setDescription('View Tasks in List')
          .addStringOption((option) =>
            option
              .setName('period')
              .setDescription('Select Period')
              .addChoices(
                { name: 'Today', value: 'today' },
                { name: 'Overdue', value: 'overdue' },
                { name: 'Tomorrow', value: 'tomorrow' },
                { name: 'TBD', value: 'tbd' }
              )
              .setRequired(true)
          )
      // .addStringOption((option) =>
      //   option.setName('category').setDescription('Select Category').setAutocomplete(true)
      // )
    )
    .addSubcommand((command) =>
      command
        .setName('check')
        .setDescription('Check Task in List')
        .addStringOption((option) =>
          option
            .setName('period')
            .setDescription('Select Period')
            .addChoices(
              { name: 'Today', value: 'today' },
              { name: 'Overdue', value: 'overdue' },
              { name: 'Tomorrow', value: 'tomorrow' },
              { name: 'TBD', value: 'tbd' }
            )
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName('number').setDescription('Task Number').setRequired(true)
        )
    )
    .addSubcommand((command) =>
      command
        .setName('add')
        .setDescription('Add Task')
        .addStringOption((option) =>
          option.setName('tag').setDescription('Set Tag').setAutocomplete(true).setRequired(true)
        )
        .addStringOption((option) =>
          option.setName('task').setDescription('Set Task').setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName('deadline').setDescription('Set Deadline').setMinValue(8)
        )
    ),

  // AutoCompleteの登録
  async autoComplete(interaction: AutocompleteInteraction) {
    // optionの情報を取得
    const forcusedOption = interaction.options.getFocused(true);

    // optionがtagの場合
    if (forcusedOption.name === 'tag') {
      // AutoCompleteの情報を取得
      const autoCompleteChoice = queryAutoCompleteChoice('subFolder', 'Task');
      // autocompleteを登録
      await interaction.respond(autoCompleteChoice);
    }
  },

  // 各コマンドの処理
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    try {
      const { options } = interaction;
      const subCommand = options.getSubcommand();

      // タスク表示処理
      if (subCommand === 'list') {
        if (subCommand === 'list') {
          // コマンドに入力された値を取得
          const relativDate: string | null = options.getString('period');

          if (!relativDate) {
            await interaction.editReply('処理が失敗しました');
            return;
          }

          // 相対日付をもとにタスクを取得
          const taskData = await queryTask(relativDate);

          if (!taskData.length) {
            interaction.editReply('Task Completed!');
          } else {
            const embedMsg = createTaskMessage.list(taskData);
            await interaction.editReply({ embeds: [embedMsg] });
          }
        }

        // タスク完了処理
      } else if (subCommand === 'check') {
        // コマンドに入力された値を取得
        const relativDate: string | null = options.getString('period');
        const number: number | null = options.getInteger('number');

        if (!relativDate || !number) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        let selectNumber: number = number - 1;

        // 相対日付をもとにタスクを取得
        const taskData = await queryTask(relativDate);

        if (!taskData.length) {
          interaction.editReply('Task Completed!');
        } else {
          await updateTask(selectNumber, taskData);
          const embedMsg = createTaskMessage.check(selectNumber, taskData);
          await interaction.editReply({ embeds: [embedMsg] });
        }

        // タスク追加処理
      } else if (subCommand === 'add') {
        // コマンドに入力された値を取得
        const tagId: string | null = options.getString('category');
        const title: string | null = options.getString('task');
        const deadline: number | null = options.getInteger('deadline');

        if (!tagId || !title || !deadline) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        const insertPageData = await insertTask(tagId, title, deadline);

        const tag = await fetchRelationName(tagId);

        // 埋め込みメッセージを作成
        const embedMsg = createTaskMessage.add(title, tag, insertPageData);

        // メッセージを送信
        await interaction.editReply({ embeds: [embedMsg] });
      }
    } catch (error: unknown) {
      await interaction.editReply('処理が失敗しました');
      console.error(error);
    }
  },

  // タスクの定期送信
  async schedule(channel: Channel) {
    try {
      // 今日のタスクを取得
      const taskData = await queryTask('today');

      if (channel.type === ChannelType.GuildText) {
        if (!taskData.length) {
          channel.send('Task Completed!');
        } else {
          const embedMsg = createTaskMessage.list(taskData);
          channel.send({ embeds: [embedMsg] });
        }
      }
    } catch (error: unknown) {
      if (channel.type === ChannelType.GuildText) {
        channel.send('処理が失敗しました');
      }
      console.error(error);
    }
  },
};
