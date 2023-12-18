import {
  notion,
  masterDbId,
  isFullPage,
  PropertyFilter,
  QueryDatabaseResponse,
} from '../../modules/notionModule';
import { fetchRelationName } from '../fetchRelationName';

export const queryTask = async (relativDate: string) => {
  try {
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
                  contains: '2d2bafca5a6c49359c9ddb45aa5da601',
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

    const taskData: { title: string; tagName: string; id: string; url: string }[] = [];

    if (!queryTaskData.results.length) return taskData;

    for (const data of queryTaskData.results) {
      const pageData = await notion.pages.retrieve({ page_id: data.id });
      if (isFullPage(pageData)) {
        const id: string = pageData.id;
        const url: string = pageData.url;

        if (!('Title' in pageData.properties)) continue;
        if (!('title' in pageData.properties.Title)) continue;
        const title: string = pageData.properties.Title.title[0].plain_text;

        if (!('relation' in pageData.properties.Tag)) continue;
        const tag: string = await fetchRelationName(pageData.properties.Tag.relation[0].id);
        taskData.push({ title: title, tagName: tag, id: id, url: url });
      }
    }

    return taskData;
  } catch (error: unknown) {
    if (error instanceof Error) console.error('Error: ', error.message);

    return [];
  }
};
