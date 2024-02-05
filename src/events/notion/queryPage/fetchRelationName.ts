import { notion } from '../../../modules/notionModule';
import { isFullPage } from '@notionhq/client';

export const fetchRelationName = async (pageId: string) => {
  let title: string = '';

  try {
    // ページIDからページ情報を取得
    const pageData = await notion.pages.retrieve({ page_id: pageId });

    // ページタイトルを取得
    if (isFullPage(pageData)) {
      if (!('Name' in pageData.properties)) return title;
      if (!('title' in pageData.properties.Name)) return title;

      title = pageData.properties.Name.title[0].plain_text;
    }

    // ページタイトルを返却
    return title;
  } catch (error) {
    console.error('Notion DB Error : ', error);
    return title;
  }
};
