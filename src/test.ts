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

    const masterFolderChoice: ApplicationCommandOptionChoiceData[] = [];
    const subFolderChoice: ApplicationCommandOptionChoiceData[] = [];

    for (const folder of jsonData.Folder) {
      const masterFolderName = folder.MasterFolder.FolderName;
      const msterFolderPageId = folder.MasterFolder.PageId;

      masterFolderChoice.push({ name: masterFolderName, value: msterFolderPageId });
    }

    return autoCompleteChoice;
  } catch (error) {
    console.error('JSONファイルの読み込みまたは解析中にエラーが発生しました: ', error);
    return [];
  }
};

queryAutoCompleteChoice();
