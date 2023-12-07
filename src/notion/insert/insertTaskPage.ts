import { CreatePageResponse } from '@notionhq/client/build/src/api-endpoints';
import { notion, masterDbId } from '../../modules/notionModule';
import { isFullPage } from '@notionhq/client';

export const insertTask = async (tagId: string, title: string, deadline: number) => {
  let url: string = '';
  let date: string = '';

  try {
    // 期限なしの場合
    if (!deadline) {
      const task: CreatePageResponse = await notion.pages.create({
        icon: {
          type: 'external',
          external: {
            url: 'https://www.notion.so/icons/checkmark_gray.svg?mode=dark',
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

      if (isFullPage(task)) {
        url = task.url;
      }

      return { url, date };

      // 期限ありの場合
    } else {
      const year = String(deadline).slice(0, 4);
      const month = String(deadline).slice(4, 6);
      const day = String(deadline).slice(6, 8);

      date = `${year}-${month}-${day}`;

      const task: CreatePageResponse = await notion.pages.create({
        icon: {
          type: 'external',
          external: {
            url: 'https://www.notion.so/icons/checkmark_gray.svg?mode=dark',
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
              start: date,
            },
          },
        },
      });

      if (isFullPage(task)) {
        url = task.url;
      }

      return { url, date };
    }
  } catch (error: unknown) {
    if (error instanceof Error) console.error('Error: ', error.message);
  }
  return { url, date };
};
