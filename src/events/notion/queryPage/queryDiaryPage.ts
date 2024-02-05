import { notion, masterDbId } from '../../../modules/notionModule';
import { isFullPage } from '@notionhq/client';
import { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

export const queryDiaryPage = async (relativDate: string, diaryTagId: string) => {
  try {
    const d: Date = new Date();
    d.setTime(d.getTime() + 1000 * 60 * 60 * 9);

    // 相対日付から日付に変換
    let date: string = '';
    if (relativDate === 'today') {
      date = d.toISOString().split('T')[0];
    } else if (relativDate === 'yesterday') {
      d.setDate(d.getDate() - 1);
      date = d.toISOString().split('T')[0];
    } else if (relativDate === 'dby') {
      d.setDate(d.getDate() - 2);
      date = d.toISOString().split('T')[0];
    }

    // 指定日付のページIDを取得
    const queryPageData: QueryDatabaseResponse = await notion.databases.query({
      database_id: masterDbId,
      filter: {
        and: [
          {
            property: 'Date',
            date: {
              equals: date,
            },
          },
          {
            property: 'Tag',
            relation: {
              contains: diaryTagId,
            },
          },
        ],
      },
    });

    if (queryPageData) {
      if (queryPageData !== null && queryPageData.results.length > 0) {
        // PageIDを取得
        const pageId = queryPageData.results[0].id;

        // URLを取得
        const retrievePageData = await notion.pages.retrieve({ page_id: pageId });

        let url: string = '';
        if (isFullPage(retrievePageData)) {
          url = retrievePageData.url;
        }

        return { date, pageId, url };
      }
      console.log('該当するデータがありませんでした');
      return undefined;
    }
  } catch (error) {
    console.error('Notion DB Error : ', error);
  }
};
