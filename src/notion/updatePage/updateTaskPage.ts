import { notion } from '../../modules/notionModule';

export const updateTask = async (number: number, taskData: { id: string }[]) => {
  try {
    const pageId = taskData[number].id;
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
