import { notion } from '../../../modules/notionModule';

// タスクの完了フラグを更新する
export const updateTask = async (pageId: string) => {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        Check: {
          checkbox: true,
        },
        Date: {
          date: {
            start: new Date().toISOString().split('T')[0],
          },
        },
      },
    });
  } catch (error) {
    console.error('UpdateTaskでエラーが発生しました : ', error);
  }
};
