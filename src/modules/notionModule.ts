// 必要なモジュールをインポート
import * as dotenv from 'dotenv';
import { Client, isFullPage } from '@notionhq/client';
import {
  PageObjectResponse,
  QueryDatabaseResponse,
  GetPageResponse,
} from '@notionhq/client/build/src/api-endpoints';
import { PropertyFilter } from '../types/@notionhq/api-endpoints';
import { NotionLibraryData, Folder, Tag } from '../types/original/notion';
import { CreatePageResponse } from '@notionhq/client/build/src/api-endpoints';

// ENVファイルの読み込み
dotenv.config();

const notion: Client = new Client({ auth: process.env.API_KEY });
const masterDbId: string = process.env.MASTER_DB_ID!;
const folderDbId: string = process.env.FOLDER_DB_ID!;
const tagDbId: string = process.env.TAG_DB_ID!;

export {
  notion,
  masterDbId,
  folderDbId,
  tagDbId,
  PageObjectResponse,
  QueryDatabaseResponse,
  isFullPage,
  GetPageResponse,
  PropertyFilter,
  NotionLibraryData as NotionData,
  Folder,
  Tag,
  CreatePageResponse,
};
