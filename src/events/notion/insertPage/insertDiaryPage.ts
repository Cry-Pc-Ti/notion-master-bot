import { notion, masterDbId } from '../../../modules/notionModule';
import { CreatePageResponse } from '@notionhq/client/build/src/api-endpoints';

export const insertDiary = async (date: string, dayOfWeek: string, diaryTagId: string) => {
  try {
    const pageData: CreatePageResponse = await notion.pages.create({
      icon: {
        type: 'external',
        external: {
          url: 'https://www.notion.so/icons/drafts_gray.svg?mode=dark',
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
                content: `${date} ${dayOfWeek}`,
              },
            },
          ],
        },
        Tag: {
          relation: [
            {
              id: diaryTagId,
            },
          ],
        },
      },
    });
  } catch (error) {
    console.error('Notion DB Error : ', error);
  }
};
