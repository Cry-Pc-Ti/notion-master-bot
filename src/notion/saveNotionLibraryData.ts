// モジュールをインポート
import * as fs from 'fs';
import {
  notion,
  folderDbId,
  tagDbId,
  isFullPage,
  GetPageResponse,
  NotionData,
} from '../modules/notionModule';
import { fetchRelationName } from './fetchRelationName';

// タグライブラリから情報を取得し、JSON形式で保存
export const saveNotionLibraryData = async () => {
  try {
    // FolderDBからページ情報を取得
    const folderDbResponse = await notion.databases.query({
      database_id: folderDbId,
      filter: {
        and: [
          {
            property: 'Archive',
            checkbox: {
              does_not_equal: true,
            },
          },
        ],
      },
      sorts: [
        {
          property: 'Name',
          direction: 'ascending',
        },
      ],
    });

    // フォルダ及びタグのデータを格納する変数を定義
    const pagesData: NotionData = { Folder: [], Tag: [] };

    // ページIDを抽出し、ページ名を取得
    for (const page of folderDbResponse.results) {
      const folderPageId: string = page.id;
      const folderPageData: GetPageResponse = await notion.pages.retrieve({
        page_id: folderPageId,
      });

      let folderName: string = '';

      if (isFullPage(folderPageData)) {
        if (!('Name' in folderPageData.properties)) continue;
        if (!('title' in folderPageData.properties.Name)) continue;

        folderName = folderPageData.properties.Name.title[0].plain_text;
      }

      // フォルダページのデータをに格納
      pagesData.Folder.push({ folderName: folderName, pageId: folderPageId });
    }

    // TagDBからページ情報を取得
    const tagDbResponse = await notion.databases.query({
      database_id: tagDbId,
      filter: {
        and: [
          {
            property: 'MasterTag',
            relation: {
              is_empty: true,
            },
          },
          {
            property: 'Archive',
            checkbox: {
              does_not_equal: true,
            },
          },
        ],
      },
      sorts: [
        {
          property: 'MasterFolder',
          direction: 'ascending',
        },
        {
          property: 'SubFolder',
          direction: 'ascending',
        },
        {
          property: 'Name',
          direction: 'ascending',
        },
      ],
    });

    // ページIDを抽出し、ページ名を取得
    for (const page of tagDbResponse.results) {
      const tagPageId: string = page.id;
      const tagPageData: GetPageResponse = await notion.pages.retrieve({
        page_id: tagPageId,
      });

      let tagName: string = '';

      if (isFullPage(tagPageData)) {
        if (!('Name' in tagPageData.properties)) continue;
        if (!('title' in tagPageData.properties.Name)) continue;
        tagName = tagPageData.properties.Name.title[0].plain_text;
      }

      let masterFolderId: string = '';
      let masterFolderName: string = '';

      if (isFullPage(tagPageData)) {
        if (!('MasterFolder' in tagPageData.properties)) continue;
        if (!('relation' in tagPageData.properties.MasterFolder)) continue;
        masterFolderId = tagPageData.properties.MasterFolder.relation[0].id;

        masterFolderName = await fetchRelationName(masterFolderId);
      }

      let subFolderId: string = '';
      let subFolderName: string = '';

      if (isFullPage(tagPageData)) {
        if (!('SubFolder' in tagPageData.properties)) continue;
        if (!('relation' in tagPageData.properties.SubFolder)) continue;
        subFolderId = tagPageData.properties.SubFolder.relation[0].id;

        subFolderName = await fetchRelationName(subFolderId);
      }

      // タグページのデータを配列に格納
      pagesData.Tag.push({
        tagName: tagName,
        pageId: tagPageId,
        masterFolder: { folderName: masterFolderName, pageId: masterFolderId },
        subFolder: { folderName: subFolderName, pageId: subFolderId },
      });
    }

    // データをJSON形式で保存
    fs.writeFileSync('notion-data.json', JSON.stringify(pagesData, null, 2));
    console.log('NotionのデータをJSONとして保存しました。');
  } catch (error: unknown) {
    console.error('Notionのデータ取得及び保存中にエラーが発生しました。: ', error);
  }
};
