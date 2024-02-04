import { notion } from '../../../modules/notionModule';

export const updateTask = async (pageId: string) => {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Check: {
          checkbox: true,
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
