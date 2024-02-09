import { notion, masterDbId } from '../../../modules/notionModule';
import { isFullPage } from '@notionhq/client';
import { GetPageResponse } from '@notionhq/client/build/src/api-endpoints';
import { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';
import { fetchRelationName } from './fetchRelationName';

export const queryMemoPage = async (tagId: string, query: string | null) => {
  try {
    let queryMemoData: QueryDatabaseResponse;

    // 検索条件(検索文字含む)からページIDを検索
    if (query) {
      queryMemoData = await notion.databases.query({
        database_id: masterDbId,
        filter: {
          and: [
            { property: 'Tag', relation: { contains: tagId } },
            { property: 'Archive', checkbox: { equals: false } },
            { property: 'Title', title: { contains: query } },
          ],
        },
        sorts: [
          { property: 'Tag', direction: 'ascending' },
          { property: 'Title', direction: 'ascending' },
        ],
      });

      // 検索条件(検索文字含まない)からページIDを検索
    } else {
      queryMemoData = await notion.databases.query({
        database_id: masterDbId,
        filter: {
          and: [
            { property: 'Tag', relation: { contains: tagId } },
            { property: 'Archive', checkbox: { equals: false } },
          ],
        },
        sorts: [
          {
            property: 'Tag',
            direction: 'ascending',
          },
        ],
      });
    }

    const memoData: { title: string; tagName: string; url: string }[] = [];

    // 検索結果がない場合、処理終了
    if (!queryMemoData.results.length) return memoData;

    // 検索結果からページ情報を取得
    for (const data of queryMemoData.results) {
      // ページIDからページ情報を取得
      const pageData: GetPageResponse = await notion.pages.retrieve({ page_id: data.id });

      // タイトル・タグ名・URLを取得し、配列に挿入
      if (isFullPage(pageData)) {
        const url: string = pageData.url;

        if (!('Title' in pageData.properties)) continue;
        if (!('title' in pageData.properties.Title)) continue;
        const title: string = pageData.properties.Title.title[0].plain_text;

        const tagName: string = await fetchRelationName(tagId);

        memoData.push({ title: title, tagName: tagName, url: url });
      }
    }

    return memoData;
  } catch (error) {
    console.error('Notion DB Error : ', error);
  }
};
