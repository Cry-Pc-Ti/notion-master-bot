// 必要なモジュールをインポート
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { ClipData, TaskData } from '../../../types/original/notion';

// Clipコマンドのメッセージを作成
export const createClipMessage = {
  insert(clipData: ClipData) {
    // 埋め込みメッセージを作成
    const embed = new EmbedBuilder()
      .setTitle('Clip Saved')
      .setURL(clipData.notionPageUrl)
      .setColor(7506394)
      .setThumbnail(clipData.faviconUrl)
      .addFields({ name: 'Title', value: clipData.title })
      .setFooter({
        text: 'Notion',
        iconURL: 'attachment://notion_logo.png',
      })
      .setTimestamp();

    const fotterAttachment = new AttachmentBuilder('img/notion_logo.png');

    return { embeds: [embed], files: [fotterAttachment], components: [] };
  },
};

// Diaryコマンドのメッセージを作成
export const createDiaryMessage = {
  update(date: string, notionPageUrl: string) {
    // 曜日を取得
    const days: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek: string = days[new Date(date).getDay()];

    // 埋め込みメッセージを作成
    const embed = new EmbedBuilder()
      .setTitle('Saved Diary')
      .setURL(notionPageUrl)
      .addFields({ name: 'Saved Diary', value: `${date} ${dayOfWeek}` })
      .setColor(7506394)
      .setFooter({
        text: 'Notion',
        iconURL: 'attachment://notion_logo.png',
      })
      .setTimestamp();

    const fotterAttachment = new AttachmentBuilder('img/notion_logo.png');

    return { embeds: [embed], files: [fotterAttachment] };
  },
};

// Memoコマンドのメッセージを作成
export const createMemoMessage = {
  // Addコマンドのメッセージを作成
  add(pageData: { title: string; body: string | null; url: string; tagName: string }) {
    const embed = new EmbedBuilder()
      .setTitle('Saved New Memo')
      .setURL(pageData.url)
      .setColor(7506394)
      .addFields({ name: 'Title', value: pageData.title })
      .addFields({ name: 'Tag', value: pageData.tagName })
      .setFooter({
        text: 'Notion',
        iconURL: 'attachment://notion_logo.png',
      })
      .setTimestamp();

    const fotterAttachment = new AttachmentBuilder('img/notion_logo.png');

    return { embeds: [embed], files: [fotterAttachment], components: [] };
  },

  // Searchコマンドのメッセージを作成
  search(pageData: { title: string; tagName: string; url: string }[]) {
    const embed = new EmbedBuilder()
      .setTitle('Memo List')
      .setColor(7506394)
      .setFooter({
        text: 'Notion',
        iconURL: 'attachment://notion_logo.png',
      })
      .setTimestamp();

    for (let i = 0; i < pageData.length; i++) {
      embed.addFields({
        name: `${i + 1}. ${pageData[i].title}`,
        value: `:white_small_square:${pageData[i].tagName}\n:white_small_square:[Continue to Page](${pageData[i].url})`,
      });
    }

    const fotterAttachment = new AttachmentBuilder('img/notion_logo.png');

    return { embeds: [embed], files: [fotterAttachment], components: [] };
  },
};

// Taskコマンドのメッセージを作成
export const createTaskMessage = {
  // Listコマンドのメッセージを作成
  list(pageData: { title: string; tagName: string; pageId: string; url: string }[]) {
    const embed = new EmbedBuilder()
      .setTitle('Task List')
      .setColor(7506394)
      .setFooter({
        text: 'Notion',
        iconURL: 'attachment://notion_logo.png',
      })
      .setTimestamp();

    for (let i = 0; i < pageData.length; i++) {
      embed.addFields({
        name: `${i + 1}. ${pageData[i].title}`,
        value: `:white_small_square:${pageData[i].tagName}\n:white_small_square:[Continue to Page](${pageData[i].url})`,
      });
    }

    const fotterAttachment = new AttachmentBuilder('img/notion_logo.png');

    return { embeds: [embed], files: [fotterAttachment], components: [] };
  },

  // Checkコマンドのメッセージを作成
  check(taskData: TaskData[]) {
    const embed = new EmbedBuilder()
      .setTitle('Task Checked')
      .setColor(7506394)
      .setFooter({
        text: 'Notion',
        iconURL: 'attachment://notion_logo.png',
      })
      .setTimestamp();

    for (let i = 0; i < taskData.length; i++) {
      embed.addFields({
        name: `${i + 1}. ${taskData[i].title} (${taskData[i].tagName})`,
        value: `:white_small_square:[Continue to Page](${taskData[i].url})`,
      });
    }

    const fotterAttachment = new AttachmentBuilder('img/notion_logo.png');

    return { embeds: [embed], files: [fotterAttachment], components: [] };
  },

  // Addコマンドのメッセージを作成
  add(title: string, tag: string, pageData: { url: string; date?: string }) {
    // 埋め込みメッセージを作成
    const embed = new EmbedBuilder()
      .setTitle('Saved New Task')
      .setURL(pageData.url)
      .setColor(7506394)
      .addFields({ name: 'Task', value: title })
      .addFields({ name: 'Tag', value: tag, inline: true })
      .setFooter({
        text: 'Notion',
        iconURL: 'attachment://notion_logo.png',
      })
      .setTimestamp();

    if (pageData.date) {
      embed.addFields({
        name: 'Deadline',
        value: pageData.date,
        inline: true,
      });
    }

    const fotterAttachment = new AttachmentBuilder('img/notion_logo.png');

    return { embeds: [embed], files: [fotterAttachment], components: [] };
  },
};
