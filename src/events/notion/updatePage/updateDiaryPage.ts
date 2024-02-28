import { notion } from '../../../modules/notionModule';
import { DiaryData } from '../../../types/original/notion';

export const updateDiary = async (diaryData: DiaryData) => {
  try {
    await notion.pages.update({
      page_id: diaryData.pageId,
      properties: {
        Tag: {
          relation: [
            {
              id: diaryData.tagId,
            },
            {
              id: diaryData.happiness.tagId,
            },
          ],
        },
        Text: {
          rich_text: [
            {
              text: {
                content: diaryData.lookback,
              },
            },
          ],
        },
      },
    });
  } catch (error) {
    console.error('Notion DB Error : ', error);
  }
};
