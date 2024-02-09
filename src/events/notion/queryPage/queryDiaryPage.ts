import { notion, masterDbId } from '../../../modules/notionModule';
import { isFullPage } from '@notionhq/client';
import { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import { DiaryData } from '../../../types/original/notion';

export const queryDiaryPage = async (diaryData: DiaryData) => {
  try {
    const d: Date = new Date();
    d.setTime(d.getTime() + 1000 * 60 * 60 * 9);

    // 相対日付から日付に変換
    let date: string = '';
    if (diaryData.relativDate === 'today') {
      date = d.toISOString().split('T')[0];
    } else if (diaryData.relativDate === 'yesterday') {
      d.setDate(d.getDate() - 1);
      date = d.toISOString().split('T')[0];
    } else if (diaryData.relativDate === 'dby') {
      d.setDate(d.getDate() - 2);
      date = d.toISOString().split('T')[0];
    }

    diaryData.date = date;

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
              contains: diaryData.tagId,
            },
          },
        ],
      },
    });

    if (queryPageData !== null && queryPageData.results.length > 0) {
      // PageIDを取得
      const pageId = queryPageData.results[0].id;
      diaryData.pageId = pageId;

      // URLを取得
      const retrievePageData = await notion.pages.retrieve({ page_id: pageId });

      if (isFullPage(retrievePageData)) diaryData.notionPageUrl = retrievePageData.url;
    }
  } catch (error) {
    console.error('Notion DB Error : ', error);
  }
};
