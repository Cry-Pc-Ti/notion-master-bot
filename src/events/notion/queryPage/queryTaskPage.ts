import { notion, masterDbId } from '../../../modules/notionModule';
import { isFullPage } from '@notionhq/client';
import { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import { PropertyFilter } from '../../../types/@notionhq/api-endpoints';
import { fetchRelationName } from './fetchRelationName';
import { loadJsonData } from '../libraryData/loadJsonData';
import { TaskData } from '../../../types/original/notion';

export const queryTask = async (relativDate: string) => {
  // タスクデータを格納する配列
  const taskData: TaskData[] = [];
  try {
    // 現在日時を取得
    const d: Date = new Date();
    d.setTime(d.getTime() + 1000 * 60 * 60 * 9);

    // 相対日付から日付を比較
    let dateProperty: PropertyFilter = { property: 'Date', date: { equals: '' } };

    // 今日
    if (relativDate === 'today') {
      const date = d.toISOString().split('T')[0];
      dateProperty = { property: 'Date', date: { equals: date } };

      // 期限切れ
    } else if (relativDate === 'overdue') {
      const date = d.toISOString().split('T')[0];
      dateProperty = { property: 'Date', date: { before: date } };

      // 明日
    } else if (relativDate === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      const date = d.toISOString().split('T')[0];
      dateProperty = { property: 'Date', date: { equals: date } };

      // 期限なし
    } else if (relativDate === 'tbd') {
      dateProperty = { property: 'Date', date: { is_empty: true } };
    }

    // NotionLibraryのデータを取得
    const jsonData = loadJsonData();

    // TaskフォルダのページIDを取得
    const taskFolderPageId: string | undefined = jsonData.Folder.SubFolder.find(
      (folder) => folder.FolderName === 'Task'
    )?.PageId;

    // タスクフォルダのページIDが取得できない場合、処理を終了
    if (!taskFolderPageId) return taskData;

    // 日付比較からタスクのデータを取得
    const queryTaskData: QueryDatabaseResponse = await notion.databases.query({
      database_id: masterDbId,
      filter: {
        and: [
          { property: 'Check', checkbox: { equals: false } },
          {
            property: 'SubFolder',
            rollup: {
              any: {
                relation: {
                  contains: taskFolderPageId,
                },
              },
            },
          },
          dateProperty,
        ],
      },
      sorts: [
        {
          property: 'Tag',
          direction: 'ascending',
        },
      ],
    });

    // タスクデータがない場合、処理を終了
    if (!queryTaskData.results.length) {
      taskData.push({ title: '', tagName: '', pageId: '', url: '' });
      return taskData;
    }

    for (const data of queryTaskData.results) {
      const pageData = await notion.pages.retrieve({ page_id: data.id });
      if (isFullPage(pageData)) {
        const pageId: string = pageData.id;
        const url: string = pageData.url;

        if (!('Title' in pageData.properties)) continue;
        if (!('title' in pageData.properties.Title)) continue;
        const title: string = pageData.properties.Title.title[0].plain_text;

        if (!('relation' in pageData.properties.Tag)) continue;
        const tagName: string = await fetchRelationName(pageData.properties.Tag.relation[0].id);
        taskData.push({ title: title, tagName: tagName, pageId: pageId, url: url });
      }
    }

    return taskData;
  } catch (error) {
    console.error('Notion DB Error : ', error);
    return taskData;
  }
};
