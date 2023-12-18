import {
  notion,
  masterDbId,
  QueryDatabaseResponse,
  GetPageResponse,
  isFullPage,
} from '../../modules/notionModule';
import { fetchRelationName } from '../fetchRelationName';

export const queryMemoPage = async (folderId: string, query: string | null) => {
  try {
    let queryMemoData: QueryDatabaseResponse;

    // 検索条件(検索文字含む)からページIDを検索
    if (query) {
      queryMemoData = await notion.databases.query({
        database_id: masterDbId,
        filter: {
          and: [
            {
              property: 'MasterFolder',
              rollup: {
                any: {
                  relation: {
                    contains: folderId,
                  },
                },
              },
            },
            {
              property: 'SubFolder',
              rollup: {
                any: { relation: { contains: '4796ee2f-0a0a-44df-b4b8-430745630a8a' } },
              },
            },
            { property: 'Archive', checkbox: { equals: false } },
            { property: 'Title', title: { contains: query } },
          ],
        },
        sorts: [
          {
            property: 'Tag',
            direction: 'ascending',
          },
        ],
      });

      // 検索条件(検索文字含まない)からページIDを検索
    } else {
      queryMemoData = await notion.databases.query({
        database_id: masterDbId,
        filter: {
          and: [
            {
              property: 'MasterFolder',
              rollup: {
                any: {
                  relation: {
                    contains: folderId,
                  },
                },
              },
            },
            {
              property: 'SubFolder',
              rollup: {
                any: { relation: { contains: '4796ee2f-0a0a-44df-b4b8-430745630a8a' } },
              },
            },
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

    if (!queryMemoData.results.length) return memoData;

    for (const data of queryMemoData.results) {
      // ページIDからページ情報を取得
      const pageData: GetPageResponse = await notion.pages.retrieve({ page_id: data.id });

      // タイトル・タグ名・URLを取得し、配列に挿入
      if (isFullPage(pageData)) {
        const url: string = pageData.url;

        if (!('Title' in pageData.properties)) continue;
        if (!('title' in pageData.properties.Title)) continue;
        const title: string = pageData.properties.Title.title[0].plain_text;

        if (!('relation' in pageData.properties.Tag)) continue;
        const tagName: string = await fetchRelationName(pageData.properties.Tag.relation[0].id);

        memoData.push({ title: title, tagName: tagName, url: url });
      }
    }

    return memoData;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error: ', error.message);
      throw error;
    }
  }
};
