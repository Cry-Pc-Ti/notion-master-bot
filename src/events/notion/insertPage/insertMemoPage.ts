import { notion, masterDbId } from '../../../modules/notionModule';
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
    if (!body) {
      const memo: CreatePageResponse = await notion.pages.create({
        icon: {
          type: 'external',
          external: {
            url: 'https://www.notion.so/icons/document_gray.svg',
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
        },
      });

      if (isFullPage(memo)) {
        insertPageData.url = memo.url;
      }

      return insertPageData;
    } else {
      const memo: CreatePageResponse = await notion.pages.create({
        icon: {
          type: 'external',
          external: {
            url: 'https://www.notion.so/icons/document_gray.svg?mode=dark',
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

      if (isFullPage(memo)) {
        insertPageData.url = memo.url;
      }

      return insertPageData;
    }
  } catch (error) {
    console.error('Notion DB Error : ', error);
  }
  return insertPageData;
};
