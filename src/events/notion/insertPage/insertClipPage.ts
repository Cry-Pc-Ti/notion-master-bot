import { notion, masterDbId } from '../../../modules/notionModule';
import { isFullPage } from '@notionhq/client';
import { CreatePageResponse } from '@notionhq/client/build/src/api-endpoints';
import { ClipData } from '../../../types/original/notion';

export const insertClip = async (clipData: ClipData) => {
  try {
    const pageData: CreatePageResponse = await notion.pages.create({
      icon: {
        type: 'external',
        external: {
          url: clipData.faviconUrl,
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
                content: clipData.title,
              },
            },
          ],
        },
        URL: {
          url: clipData.siteUrl,
        },
        Tag: {
          relation: clipData.tagId,
        },
        Favorite: {
          checkbox: clipData.favorite,
        },
      },
    });

    if (isFullPage(pageData)) clipData.notionUrl = pageData.url;

    return clipData;
  } catch (error) {
    console.error('Notion DB Error : ', error);
  }
};
