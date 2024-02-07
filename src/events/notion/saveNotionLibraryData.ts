// モジュールをインポート
import * as fs from 'fs';
import { notion, folderDbId, tagDbId, NotionLibraryData } from '../../modules/notionModule';
import { isFullPage } from '@notionhq/client';
import { GetPageResponse } from '@notionhq/client/build/src/api-endpoints';
import { fetchRelationName } from './queryPage/fetchRelationName';

// フォルダ・タグライブラリからデータを取得し、JSON形式で保存
export const saveNotionLibraryData = async () => {
  // フォルダ及びタグのデータを格納する変数を定義
  const notionLibraryData: NotionLibraryData = {
    Folder: { MasterFolder: [], SubFolder: [] },
    Tag: [],
  };

  try {
    // Folderのデータを取得・格納
    // FolderDBからマスターフォルダのデータを取得
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
          {
            property: 'isMaster',
            checkbox: {
              equals: true,
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

    // ページIDを抽出し、ページ名を取得
    for (const page of folderDbResponse.results) {
      const masterFolderPageId: string = page.id;
      const folderPageData: GetPageResponse = await notion.pages.retrieve({
        page_id: masterFolderPageId,
      });

      if (isFullPage(folderPageData)) {
        if (!('Name' in folderPageData.properties)) continue;
        if (!('title' in folderPageData.properties.Name)) continue;

        // マスターフォルダ名を取得
        const masterFolderName = folderPageData.properties.Name.title[0].plain_text;

        if (!('SubFolder' in folderPageData.properties)) continue;
        if (!('relation' in folderPageData.properties.SubFolder)) continue;

        // リレーションされているサブフォルダの情報を取得
        const subFolderRelationData = folderPageData.properties.SubFolder.relation;

        const subFolderData: { FolderName: string; PageId: string }[] = [];

        // サブフォルダの情報を取得し、配列に格納
        for (const page of subFolderRelationData) {
          const pageId = page.id;
          const folderName = await fetchRelationName(pageId);

          subFolderData.push({ FolderName: folderName, PageId: pageId });
        }

        // マスタフォルダのデータを格納
        notionLibraryData.Folder.MasterFolder.push({
          FolderName: masterFolderName,
          PageId: masterFolderPageId,
          SubFolderPageId: subFolderData.map((data) => data.PageId),
        });

        // サブフォルダのデータを格納
        notionLibraryData.Folder.SubFolder.push(
          ...subFolderData.filter(
            (data) =>
              !notionLibraryData.Folder.SubFolder.some(
                (existingData) => existingData.PageId === data.PageId
              )
          )
        );
      }
    }

    // Tagのデータを取得・格納
    // TagDBからページ情報を取得
    const tagDbResponse = await notion.databases.query({
      database_id: tagDbId,
      filter: {
        and: [
          {
            property: 'isMasterTag',
            checkbox: {
              does_not_equal: true,
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

      let masterFolderPageId: string = '';
      let masterFolderName: string = '';

      if (isFullPage(tagPageData)) {
        if (!('MasterFolder' in tagPageData.properties)) continue;
        if (!('relation' in tagPageData.properties.MasterFolder)) continue;

        masterFolderPageId = tagPageData.properties.MasterFolder.relation[0].id;
        masterFolderName = await fetchRelationName(masterFolderPageId);
      }

      let subFolderPageId: string = '';
      let subFolderName: string = '';

      if (isFullPage(tagPageData)) {
        if (!('SubFolder' in tagPageData.properties)) continue;
        if (!('relation' in tagPageData.properties.SubFolder)) continue;

        subFolderPageId = tagPageData.properties.SubFolder.relation[0].id;
        subFolderName = await fetchRelationName(subFolderPageId);
      }

      // タグページのデータを配列に格納
      notionLibraryData.Tag.push({
        TagName: tagName,
        PageId: tagPageId,
        MasterFolder: {
          FolderName: masterFolderName,
          PageId: masterFolderPageId,
          SubFolder: { FolderName: subFolderName, PageId: subFolderPageId },
        },
      });
    }

    // データをJSON形式で保存
    fs.writeFileSync('notion-data.json', JSON.stringify(notionLibraryData, null, 2));
    console.log('NotionライブラリのデータをJSONとして保存しました。');
  } catch (error) {
    console.error('Notionライブラリのデータ取得及び保存中にエラーが発生しました。: ', error);
  }
};

(async () => {
  await saveNotionLibraryData();
})();
