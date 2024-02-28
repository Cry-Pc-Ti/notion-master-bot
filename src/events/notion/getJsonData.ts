import fs from 'fs';
import path from 'path';
import { NotionLibraryData } from '../../modules/notionModule';

export const getJsonData = (): NotionLibraryData => {
  const jsonFilePath = 'notion-data.json';
  const absolutePath = path.resolve(jsonFilePath);
  delete require.cache[absolutePath];

  // JSONファイルの読み込み
  const rawData = fs.readFileSync(absolutePath, 'utf-8');
  // JSONデータをオブジェクトに変換
  const jsonData: NotionLibraryData = JSON.parse(rawData);

  return jsonData;
};
