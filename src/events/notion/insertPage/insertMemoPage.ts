<<<<<<< HEAD
import { notion, masterDbId } from '../../../modules/notionModule';
=======
import { notion, masterDbId, documentPageIconUrl } from '../../../modules/notionModule';
>>>>>>> feature
import { isFullPage } from '@notionhq/client';
import { CreatePageResponse } from '@notionhq/client/build/src/api-endpoints';

export const insertMemo = async (tagId: string, title: string, body: string | null) => {
  const insertPageData: { title: string; body: string | null; url: string; tagName: string } = {
    title: title,
    body: body,
    url: '',
    tagName: '',
  };

  try {
    // Notionに新規ページを追加
    if (!body) {
      const memo: CreatePageResponse = await notion.pages.create({
        icon: {
          type: 'external',
          external: {
<<<<<<< HEAD
            url: 'https://www.notion.so/icons/document_gray.svg?mode=dark',
=======
            url: documentPageIconUrl,
>>>>>>> feature
          },
        },
        parent: {
          database_id: masterDbId,
        },
        properties: {
          Title: {
            type: 'title',
            title: [
              {
                type: 'text',
                text: {
                  content: title,
                },
              },
            ],
          },
          Tag: {
            relation: [
              {
                id: tagId,
              },
            ],
          },
          Date: {
            date: {
              start: new Date().toISOString().split('T')[0],
            },
          },
        },
      });

      // 挿入したページのURLを取得
      if (isFullPage(memo)) insertPageData.url = memo.url;

      return insertPageData;
    } else {
      // Notionに新規ページを追加
      const memo: CreatePageResponse = await notion.pages.create({
        icon: {
          type: 'external',
          external: {
<<<<<<< HEAD
            url: 'https://www.notion.so/icons/document_gray.svg?mode=dark',
=======
            url: documentPageIconUrl,
>>>>>>> feature
          },
        },
        parent: {
          database_id: masterDbId,
        },
        properties: {
          Title: {
            type: 'title',
            title: [
              {
                type: 'text',
                text: {
                  content: title,
                },
              },
            ],
          },
          Tag: {
            relation: [
              {
                id: tagId,
              },
            ],
          },
          Date: {
            date: {
              start: new Date().toISOString().split('T')[0],
            },
          },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ type: 'text', text: { content: body } }],
            },
          },
        ],
      });

      // 挿入したページのURLを取得
      if (isFullPage(memo)) insertPageData.url = memo.url;

      return insertPageData;
    }
  } catch (error) {
    console.error('Notion DB Error : ', error);
  }
  return insertPageData;
};
