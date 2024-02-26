import { notion, masterDbId, diaryPageIconUrl } from '../../../modules/notionModule';

export const insertDiary = async (date: string, dayOfWeek: string, diaryTagId: string) => {
  try {
    await notion.pages.create({
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
        Date: {
          date: {
            start: date,
          },
        },
      },
    });
  } catch (error) {
    console.error('Notion DB Error : ', error);
  }
};
