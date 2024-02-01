// 必要なモジュールをインポート
import * as fs from 'fs';
import { ApplicationCommandOptionChoiceData } from '../../modules/discordModule';
import { NotionLibraryData } from '../../types/original/notion';

export const queryAutoCompleteChoice = (folder: string, folderName: string) => {
  try {
    // JSONファイルの読み込み
    const fileData = fs.readFileSync('notion-data.json', 'utf-8');

    // JSONデータをオブジェクトに変換
    const jsonData: NotionLibraryData = JSON.parse(fileData);

    const autoCompleteChoice: ApplicationCommandOptionChoiceData[] = [];

    // 重複を確認するためのセット
    const addedFolder: Set<string> = new Set();

    for (const tag of jsonData.Tag) {
      if (folder === 'masterFolder') {
        if (
          tag.MasterFolder.SubFolder &&
          tag.MasterFolder.SubFolder.FolderName &&
          tag.MasterFolder.SubFolder.FolderName === folderName
        ) {
          const folderName = tag.MasterFolder.FolderName;
          const pageId = tag.MasterFolder.PageId;

          if (!addedFolder.has(folderName)) {
            autoCompleteChoice.push({ name: folderName, value: pageId });
            addedFolder.add(folderName);
          }
        }
      } else if (folder === 'subFolder') {
        if (
          tag.MasterFolder.SubFolder &&
          tag.MasterFolder.SubFolder.FolderName &&
          tag.MasterFolder.SubFolder.FolderName === folderName
        ) {
          const tagName = tag.TagName;
          const pageId = tag.PageId;

          if (!addedFolder.has(tagName)) {
            autoCompleteChoice.push({ name: tagName, value: pageId });
            addedFolder.add(tagName);
          }
        }
      }
    }

    return autoCompleteChoice;
  } catch (error) {
    console.error('JSONファイルの読み込みまたは解析中にエラーが発生しました: ', error);
    return [];
  }
};
