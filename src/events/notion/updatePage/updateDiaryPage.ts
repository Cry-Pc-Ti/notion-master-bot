import { notion } from '../../../modules/notionModule';

export const updateDiary = async (
  pageId: string,
  diaryTagId: string,
  happiness: string,
  lookback: string
) => {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Tag: {
          relation: [
            {
              id: diaryTagId,
            },
            {
              id: happiness,
            },
          ],
        },
        Text: {
          rich_text: [
            {
              text: {
                content: lookback,
              },
            },
          ],
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error: ', error.message);
      throw error;
    }
  }
};
