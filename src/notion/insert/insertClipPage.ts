import { notion, masterDbId, isFullPage, CreatePageResponse } from '../../modules/notionModule';

export const insertClip = async (
  faviconUrl: string,
  title: string,
  // tagId: string,
  favorite: boolean
) => {
  try {
    const pageData: CreatePageResponse = await notion.pages.create({
      icon: {
        type: 'external',
        external: {
          url: faviconUrl,
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
        // Tag: {
        //   relation: [
        //     {
        //       id: tagId,
        //     },
        //   ],
        // },
        Favorite: {
          checkbox: favorite,
        },
      },
    });

    const insertPageData: { url: string } = { url: '' };
    if (isFullPage(pageData)) {
      insertPageData.url = pageData.url;
    }

    return insertPageData;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Notion DB Error: ', error.message);
      throw error;
    }
  }
};
