// 必要なモジュールをインポート
import * as fs from 'fs';
import { ApplicationCommandOptionChoiceData } from './modules/discordModule';
import { NotionLibraryData } from './types/original/notion';

export const queryAutoCompleteChoice = () => {
  try {
    // JSONファイルの読み込み
    const fileData = fs.readFileSync('notion-data.json', 'utf-8');

    // JSONデータをオブジェクトに変換
    const jsonData: NotionLibraryData = JSON.parse(fileData);

    const autoCompleteChoice: ApplicationCommandOptionChoiceData[] = [];

    // 重複を確認するためのセット
    const addedFolder: Set<string> = new Set();

    const folderChoice: ApplicationCommandOptionChoiceData[] = [];

    for (const folder of jsonData.Folder.MasterFolder) {
      const folderName = folder.FolderName;
      const folderId = folder.PageId;

      folderChoice.push({ name: folderName, value: folderId });
    }

    console.log(folderChoice);

    return autoCompleteChoice;
  } catch (error) {
    console.error('JSONファイルの読み込みまたは解析中にエラーが発生しました: ', error);
    return [];
  }
};

queryAutoCompleteChoice();
