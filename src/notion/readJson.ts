import fs from 'fs';
import { NotionLibraryData } from '../modules/notionModule';

// JSONファイルの読み込み
const fileData = fs.readFileSync('notion-data.json', 'utf-8');

// JSONデータをオブジェクトに変換
export const jsonData: NotionLibraryData = JSON.parse(fileData);
