import fs from 'fs';
import path from 'path';
import { NotionLibraryData } from '../../../modules/notionModule';

export const loadJsonData = (): NotionLibraryData => {
  const jsonFilePath = 'static/data/notion-library-data.json';
  const absolutePath = path.resolve(jsonFilePath);
  delete require.cache[absolutePath];

  // JSONファイルの読み込み
  const rawData = fs.readFileSync(absolutePath, 'utf-8');
  // JSONデータをオブジェクトに変換
  const jsonData: NotionLibraryData = JSON.parse(rawData);

  return jsonData;
};
