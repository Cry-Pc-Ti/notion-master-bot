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

const diaryTagId: string = '776bc3253a04467eae4c9f4dcc186b3d';

const taskPageIconUrl: string = 'https://www.notion.so/icons/checkmark_gray.svg';
const documentPageIconUrl: string = 'https://www.notion.so/icons/document_gray.svg';
const diaryPageIconUrl: string = 'https://www.notion.so/icons/drafts_gray.svg';

const taskListViewUrl: string =
  'https://www.notion.so/53b960ffc0134a33901e052276059d3c?v=899332e84d3846438c19a5912ef0aa18&pvs=4';

export {
  notion,
  masterDbId,
  folderDbId,
  tagDbId,
  diaryTagId,
  taskPageIconUrl,
  documentPageIconUrl,
  diaryPageIconUrl,
  taskListViewUrl,
  NotionLibraryData,
  FolderData,
  TagData,
};
