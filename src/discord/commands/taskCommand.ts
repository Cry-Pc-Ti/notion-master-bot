import {
  SlashCommandBuilder,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Channel,
  ChannelType,
  ApplicationCommandOptionChoiceData,
} from '../../modules/discordModule';
import { queryTask } from '../../notion/queryPage/queryTaskPage';
import { updateTask } from '../../notion/updatePage/updateTaskPage';
import { insertTask } from '../../notion/insertPage/insertTaskPage';
import { createTaskMessage } from '../createEmbedMessage';
import { fetchRelationName } from '../../notion/fetchRelationName';
import {
  ActionRowBuilder,
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { jsonData } from '../../notion/readJson';

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
        .addBooleanOption((option) => option.setName('all').setDescription('View All Task'))
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
      const autoCompleteChoice: ApplicationCommandOptionChoiceData[] = [];

      // 重複を確認するためのセット
      const addedFolder: Set<string> = new Set();

      const taskFolderPageId: string = jsonData.Folder.SubFolder.find(
        (folder) => folder.FolderName === 'Task'
      )?.PageId;

      // SubFolderがTaskのフォルダ名とページIDを取得
      if (!taskFolderPageId) return;

      for (const masterFolder of jsonData.Folder.MasterFolder) {
        // SubFolderPageIdがTaskのmasterFolderを取得
        if (taskFolderPageId) {
          if (masterFolder.SubFolderPageId.includes(taskFolderPageId)) {
            const folderName = masterFolder.FolderName;
            const pageId = masterFolder.PageId;

            if (!addedFolder.has(folderName)) {
              autoCompleteChoice.push({ name: folderName, value: pageId });
              addedFolder.add(folderName);
            }
          }
        }
      }

      // Autocompleteを登録
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

          // タスクがない場合、処理を終了
          if (!taskData.length) {
            await interaction.editReply('Task Completed!');

            // タスクがある場合、埋め込みメッセージを作成・送信
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
        const title: string | null = options.getString('task');
        const subFolderId: string | null = options.getString('folder');
        const deadline: number | null = options.getInteger('deadline');

        console.log(title, subFolderId, deadline);

        if (!subFolderId || !title) {
          await interaction.editReply('処理が失敗しました');
          return;
        }

        // 取得したサブフォルダに含まれているタグを取得
        const taskFolderPageId = jsonData.Folder.SubFolder.find(
          (folder) => folder.FolderName === 'Task'
        )?.PageId;

        const matchingTags = jsonData.Tag.filter(
          (tag) =>
            tag.MasterFolder.PageId === subFolderId &&
            tag.MasterFolder.SubFolder.PageId === taskFolderPageId
        );

        const tagSelectMenu: StringSelectMenuBuilder = new StringSelectMenuBuilder()
          .setCustomId('tag')
          .setPlaceholder('Select Tag')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(matchingTags.map((tag) => ({ label: tag.TagName, value: tag.PageId })));

        // SelectMenuを送信
        const row: ActionRowBuilder<StringSelectMenuBuilder> =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(tagSelectMenu);

        const selectResponse = await interaction.editReply({ components: [row] });

        // SelectMenuの値を取得
        const collector = selectResponse.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          filter: (selectMenuInteraction) => selectMenuInteraction.user.id === interaction.user.id,
        });

        collector.on('collect', async (selectMenuInteraction: StringSelectMenuInteraction) => {
          console.log(selectMenuInteraction.values);

          const selectedTagId = selectMenuInteraction.values[0];

          const insertPageData = await insertTask(selectedTagId, title, deadline);

          const tagName = await fetchRelationName(selectedTagId);

          // 埋め込みメッセージを作成・送信
          const embedMsg = createTaskMessage.add(title, tagName, insertPageData);
          await selectMenuInteraction.update(embedMsg);
        });
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
