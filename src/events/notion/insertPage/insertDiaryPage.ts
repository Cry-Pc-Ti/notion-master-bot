import { notion, masterDbId, diaryPageIconUrl } from '../../../modules/notionModule';
import { CreatePageResponse } from '@notionhq/client/build/src/api-endpoints';

export const insertDiary = async (date: string, dayOfWeek: string, diaryTagId: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const pageData: CreatePageResponse = await notion.pages.create({
      icon: {
        type: 'external',
        external: {
          url: diaryPageIconUrl,
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
