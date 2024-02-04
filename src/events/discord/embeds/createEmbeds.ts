// 必要なモジュールをインポート
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';

export const createDiaryMessage = {
  update(date: string, url: string) {
    // 曜日を取得
    const days: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek: string = days[new Date(date).getDay()];

    // 埋め込みメッセージを作成
    const embed = new EmbedBuilder()
      .setTitle('Success: Diary Entry Saved')
      .setURL(url)
      .addFields({ name: 'Saved Diary', value: `${date} ${dayOfWeek}` })
      .setColor(7506394)
      .setFooter({
        text: 'Notion',
        iconURL: 'attachment://notion-logo.png',
      })
      .setTimestamp();

    const fotterAttachment = new AttachmentBuilder('img/notion-logo.png');

    return { embeds: [embed], files: [fotterAttachment] };
  },
};

export const createMemoMessage = {
  // メモ追加メッセージを作成
  insert(pageData: { title: string; body: string | null; url: string; tagName: string }) {
    const embedMsg = new EmbedBuilder()
      .setTitle('Success: Memo Entry Saved')
      .setURL(pageData.url)
      .setColor(7506394)
      .addFields({ name: 'Title', value: pageData.title })
      .addFields({ name: 'Category', value: pageData.tagName })
      .setFooter({
        text: 'Notion',
        iconURL:
          'https://cdn.discordapp.com/attachments/896987534645669918/1134089854049861662/notion.png',
      })
      .setTimestamp();
    return embedMsg;
  },

  // メモ検索メッセージを作成
  search(pageData: { title: string; tagName: string; url: string }[]) {
    const embedMsg = new EmbedBuilder()
      .setTitle('Memo List')
      .setColor(7506394)
      .setFooter({
        text: 'Notion',
        iconURL:
          'https://cdn.discordapp.com/attachments/896987534645669918/1134089854049861662/notion.png',
      })
      .setTimestamp();

    if (pageData[0].tagName.includes('.Thinking')) {
      embedMsg.setURL(
        'https://www.notion.so/fdbef86856a842f9a21d2ef304a5f5f5?v=f1b1d5e3770d4883829302228e0c0eeb&pvs=4'
      );
    } else if (pageData[0].tagName.includes('.Work')) {
      embedMsg.setURL(
        'https://www.notion.so/fdbef86856a842f9a21d2ef304a5f5f5?v=ecdb97214d274897b9f40526602b4c76&pvs=4'
      );
    }

    for (let i = 0; i < pageData.length; i++) {
      embedMsg.addFields({
        name: `${i + 1}. ${pageData[i].title}`,
        value: `:white_small_square:${pageData[i].tagName}\n:white_small_square:[Continue to Page](${pageData[i].url})`,
      });
    }

    return embedMsg;
  },
};

export const createSaveMessage = {
  update(title: string, url: string) {
    // 埋め込みメッセージを作成
    const embedMsg = new EmbedBuilder()
      .setTitle('Success: Memo Entry Saved')
      .setURL(url)
      .setColor(7506394)
      .addFields({ name: 'Title', value: title })
      .setFooter({
        text: 'Notion',
        iconURL:
          'https://cdn.discordapp.com/attachments/896987534645669918/1134089854049861662/notion.png',
      })
      .setTimestamp();
    return embedMsg;
  },
};

export const createTaskMessage = {
  // タスク一覧表示コマンドのメッセージを作成
  list(pageData: { title: string; tagName: string; pageId: string; url: string }[]) {
    const embed = new EmbedBuilder()
      .setTitle('Task List')
      .setURL(
        'https://www.notion.so/53b960ffc0134a33901e052276059d3c?v=899332e84d3846438c19a5912ef0aa18&pvs=4'
      )
      .setColor(7506394)
      .setFooter({
        text: 'Notion',
        iconURL: 'attachment://notion-logo.png',
      })
      .setTimestamp();

    for (let i = 0; i < pageData.length; i++) {
      embed.addFields({
        name: `${i + 1}. ${pageData[i].title}`,
        value: `:white_small_square:${pageData[i].tagName}\n:white_small_square:[Continue to Page](${pageData[i].url})`,
      });
    }

    const fotterAttachment = new AttachmentBuilder('img/notion-logo.png');

    return { embeds: [embed], files: [fotterAttachment], components: [] };
  },

  // タスクチェックコマンドのメッセージを作成
  check(taskData: { title: string; tagName: string; pageId: string; url: string }) {
    const embed = new EmbedBuilder()
      .setTitle('Nice Work!')
      .setURL(taskData.url)
      .setColor(7506394)
      .addFields({
        name: 'Checked Task',
        value: `${taskData.title} (${taskData.tagName})`,
      })
      .setFooter({
        text: 'Notion',
        iconURL: 'attachment://notion-logo.png',
      })
      .setTimestamp();

    const fotterAttachment = new AttachmentBuilder('img/notion-logo.png');

    return { embeds: [embed], files: [fotterAttachment], components: [] };
  },

  // タスク追加コマンドのメッセージを作成
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
        iconURL: 'attachment://notion-logo.png',
      })
      .setTimestamp();

    if (pageData.date) {
      embed.addFields({
        name: 'Deadline',
        value: pageData.date,
        inline: true,
      });
    }

    const fotterAttachment = new AttachmentBuilder('img/notion-logo.png');

    return { embeds: [embed], files: [fotterAttachment], components: [] };
  },
};
