import { notion } from '../../../modules/notionModule';
import { isFullPage } from '@notionhq/client';

export const fetchRelationName = async (pageId: string) => {
  try {
    // ページIDからページ情報を取得
    const pageData = await notion.pages.retrieve({ page_id: pageId });

    // ページタイトルを取得
    if (isFullPage(pageData)) {
      if (!('Name' in pageData.properties)) return '';
      if (!('title' in pageData.properties.Name)) return '';

      return pageData.properties.Name.title[0].plain_text;
    }

    // ページタイトルを返却
    return '';
  } catch (error) {
    console.error('Notion DB Error : ', error);
    return '';
  }
};
