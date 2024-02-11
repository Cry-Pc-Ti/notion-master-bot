// 必要なモジュールをインポート
import * as dotenv from 'dotenv';
import { Client } from '@notionhq/client';
import { NotionLibraryData, FolderData, TagData } from '../types/original/notion';

// ENVファイルの読み込み
dotenv.config();

const notion: Client = new Client({ auth: process.env.API_KEY });
const masterDbId: string = process.env.MASTER_DB_ID!;
const folderDbId: string = process.env.FOLDER_DB_ID!;
const tagDbId: string = process.env.TAG_DB_ID!;

const taskPageIconUrl: string = 'https://www.notion.so/icons/checkmark_gray.svg';
const documentPageIconUrl: string = 'https://www.notion.so/icons/document_gray.svg';
const diaryPageIconUrl: string = 'https://www.notion.so/icons/drafts_gray.svg';

export {
  notion,
  masterDbId,
  folderDbId,
  tagDbId,
  NotionLibraryData,
  FolderData,
  TagData,
  taskPageIconUrl,
  documentPageIconUrl,
  diaryPageIconUrl,
};
