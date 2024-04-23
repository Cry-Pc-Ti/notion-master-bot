import {
  SlashCommandBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Channel,
  ChannelType,
  ApplicationCommandOptionChoiceData,
  ActionRowBuilder,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { queryTask } from '../../notion/queryPage/queryTaskPage';
import { updateTask } from '../../notion/updatePage/updateTaskPage';
import { insertTask } from '../../notion/insertPage/insertTaskPage';
import { createTaskMessage } from '../message/createEmbed';
import { fetchRelationName } from '../../notion/queryPage/fetchRelationName';
import { loadJsonData } from '../../notion/libraryData/loadJsonData';
import { TaskData } from '../../../types';

export const taskCommand = {
  // スラッシュコマンドの定義
  data: new SlashCommandBuilder()
    .setName('task')
    .setDescription('Control Notion Task')
    .addSubcommand((command) =>
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
    )
    .addSubcommand((command) =>
      command
        .setName('add')
        .setDescription('Add Task')
        .addStringOption((option) =>
          option.setName('task').setDescription('Set Task').setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('folder')
            .setDescription('Set Folder')
            .setAutocomplete(true)
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option.setName('deadline').setDescription('Set Deadline').setMinValue(8)
        )
    ),

  // AutoCompleteの登録
  async autocomplete(interaction: AutocompleteInteraction) {
    // optionの情報を取得
    const forcusedOption = interaction.options.getFocused(true);

    // optionがtagの場合
    if (forcusedOption.name === 'folder') {
      // Autocompleteの情報を取得
      const autocompleteChoice: ApplicationCommandOptionChoiceData[] = [];

      // 重複を確認するためのセット
      const addedFolder: Set<string> = new Set();

      // NotionLibraryのデータを取得
      const jsonData = loadJsonData();

      // TaskフォルダのページIDを取得
      const taskFolderPageId: string | undefined = jsonData.Folder.SubFolder.find(
        (folder) => folder.FolderName === 'Task'
      )?.PageId;

      // サブフォルダページIDがTaskのマスタフォルダを取得
      for (const masterFolder of jsonData.Folder.MasterFolder) {
        if (
          taskFolderPageId &&
          masterFolder.SubFolderPageId &&
          masterFolder.SubFolderPageId.includes(taskFolderPageId)
        ) {
          const folderName = masterFolder.FolderName;
          const pageId = masterFolder.PageId;

          if (!addedFolder.has(folderName)) {
            autocompleteChoice.push({ name: folderName, value: pageId });
            addedFolder.add(folderName);
          }
        }
      }

      // Autocompleteを登録
      await interaction.respond(autocompleteChoice);
    }
  },

  // 各コマンドの処理
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.replied && !interaction.deferred) await interaction.deferReply();
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
          const taskData: TaskData[] = await queryTask(relativDate);

          // タスクデータが空の場合、処理を終了
          if (!taskData.length) {
            await interaction.editReply('処理が失敗しました');
            return;
          }

          // タスクがない場合、処理を終了
          if (
            taskData[0].title === '' &&
            taskData[0].tagName === '' &&
            taskData[0].pageId === '' &&
            taskData[0].url === ''
          ) {
            await interaction.editReply('Task Completed!');

            // タスクがある場合、埋め込みメッセージを作成・送信
          } else {
            const embed = createTaskMessage.list(taskData);
            await interaction.editReply(embed);
          }
        }

        // タスク完了処理
      } else if (subCommand === 'check') {
        // コマンドに入力された値を取得
        const relativDate: string | null = options.getString('period');

        // 必須入力項目が取得できない場合、処理を終了
        if (!relativDate) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // 相対日付をもとにタスクを取得
        const allTaskData = await queryTask(relativDate);

        // タスクデータが空の場合、処理を終了
        if (!allTaskData.length) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // タスクがない場合、処理を終了
        if (
          allTaskData[0].title === '' &&
          allTaskData[0].tagName === '' &&
          allTaskData[0].pageId === '' &&
          allTaskData[0].url === ''
        ) {
          await interaction.editReply('Task Completed!');

          // タスクがある場合の処理
        } else {
          // タスクの件数を取得
          const taskCount: number = allTaskData.length;

          // セレクトメニューを作成
          const taskSelectMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
            .setCustomId('task')
            .setPlaceholder('Select Completed Task')
            .setMinValues(1)
            .setMaxValues(taskCount)
            .addOptions(
              allTaskData.map((task) => ({
                label: `${task.title} (${task.tagName})`,
                value: task.pageId,
              }))
            );

          // セレクトメニューを送信
          const row: ActionRowBuilder<StringSelectMenuBuilder> =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(taskSelectMenu);

          const selectResponse = await interaction.editReply({ components: [row] });

          // セレクトメニューで選択された値を取得
          const tagCollector = selectResponse.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            filter: (selectMenuInteraction) =>
              selectMenuInteraction.user.id === interaction.user.id,
          });

          tagCollector.on('collect', async (selectMenuInteraction: StringSelectMenuInteraction) => {
            const checkTaskPageId = selectMenuInteraction.values;
            const checkedTaskData: TaskData[] = [];

            for (const pageId of checkTaskPageId) {
              // セレクトメニューで選択されたタスクを完了済みに更新
              await updateTask(pageId);

              // 完了済みのタスクデータを取得
              const task = allTaskData.find((task) => task.pageId === pageId);
              if (task) checkedTaskData.push(task);
            }

            // 完了済みタスクデータが取得できない場合、処理を終了
            if (!checkedTaskData.length) {
              await interaction.editReply('処理が失敗しました');
              return;
            }

            // 埋め込みメッセージを作成・送信
            const embed = createTaskMessage.check(checkedTaskData);
            await interaction.editReply(embed);
          });
        }

        // タスク追加処理
      } else if (subCommand === 'add') {
        // コマンドに入力された値を取得
        const title: string | null = options.getString('task');
        const masterFolderPageId: string | null = options.getString('folder');
        const deadline: number | null = options.getInteger('deadline');

        // 必須入力項目がnullの場合、処理を終了
        if (!title || !masterFolderPageId) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // NotionLibraryのデータを取得
        const jsonData = loadJsonData();

        // TaskフォルダのページIDを取得
        const taskFolderPageId: string | undefined = jsonData.Folder.SubFolder.find(
          (folder) => folder.FolderName === 'Task'
        )?.PageId;

        // タスクフォルダのページIDが取得できない場合、処理を終了
        if (!taskFolderPageId) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // 取得したマスタフォルダに含まれているタグを取得
        const matchingTags = jsonData.Tag.filter(
          (tag) =>
            tag.MasterFolder.PageId === masterFolderPageId &&
            tag.MasterFolder.SubFolder.PageId === taskFolderPageId
        );

        // セレクトメニューを作成
        const tagSelectMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
          .setCustomId('tag')
          .setPlaceholder('Select Tag')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(matchingTags.map((tag) => ({ label: tag.TagName, value: tag.PageId })));

        // セレクトメニューを送信
        const row: ActionRowBuilder<StringSelectMenuBuilder> =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(tagSelectMenu);

        const selectResponse = await interaction.editReply({ components: [row] });

        // セレクトメニューで選択された値を取得
        const tagCollector = selectResponse.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          filter: (selectMenuInteraction) => selectMenuInteraction.user.id === interaction.user.id,
        });

        tagCollector.on('collect', async (selectMenuInteraction: StringSelectMenuInteraction) => {
          // セレクトメニューで選択されたタグのページIDを取得
          const selectedTagId = selectMenuInteraction.values[0];

          // Notionに新規ページを追加
          const taskData = await insertTask(selectedTagId, title, deadline);

          // 選択されたタグの名前を取得
          const tagName = await fetchRelationName(selectedTagId);

          // 埋め込みメッセージを作成・送信
          const embed = createTaskMessage.add(title, tagName, taskData);
          await interaction.editReply(embed);
        });
      }
    } catch (error) {
      await interaction.editReply('処理が失敗しました');
      console.error(error);
    }
  },

  // タスクの定期送信
  async sendTaskList(channel: Channel) {
    try {
      // 今日のタスクを取得
      const taskData = await queryTask('today');

      if (channel.type === ChannelType.GuildText) {
        if (
          taskData[0].title === '' &&
          taskData[0].tagName === '' &&
          taskData[0].pageId === '' &&
          taskData[0].url === ''
        ) {
          channel.send('Task Completed!');
        } else {
          const embed = createTaskMessage.list(taskData);
          channel.send(embed);
        }
      }
    } catch (error) {
      if (channel.type === ChannelType.GuildText) channel.send('処理が失敗しました');

      console.error(error);
    }
  },
};
