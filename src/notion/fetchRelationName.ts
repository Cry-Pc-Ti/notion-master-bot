import { notion, isFullPage } from '../modules/notionModule';

export const fetchRelationName = async (pageId: string) => {
  try {
    // ページIDからページ情報を取得
    const pageData = await notion.pages.retrieve({ page_id: pageId });

    let title: string = '';

    // ページタイトルを取得
    if (isFullPage(pageData)) {
      if (!('Name' in pageData.properties)) return '';
      if (!('title' in pageData.properties.Name)) return '';

      title = pageData.properties.Name.title[0].plain_text;
    }

    // ページタイトルを返却
    return title;
  } catch (error: unknown) {
    if (error instanceof Error) console.error('Error: ', error.message);
    return '';
  }
};
