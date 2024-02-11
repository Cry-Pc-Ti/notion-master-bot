export interface FolderData {
  MasterFolder: MasterFolderData[];
  SubFolder: SubFolderData[];
}

export interface MasterFolderData {
  FolderName: string;
  PageId: string;
  SubFolderPageId: string[];
}

export interface SubFolderData {
  FolderName: string;
  PageId: string;
}

export interface TagData {
  TagName: string;
  PageId: string;
  MasterFolder: {
    FolderName: string;
    PageId: string;
    SubFolder: { FolderName: string; PageId: string };
  };
}

export interface NotionLibraryData {
  Folder: FolderData;
  Tag: TagData[];
}

export interface ClipData {
  faviconUrl: string;
  notionPageUrl: string;
  title: string;
  siteUrl: string;
  tagId: { id: string }[];
  favorite: boolean;
}

export interface DiaryData {
  relativDate: string;
  happiness: string;
  lookback: string;
  date: string;
  tagId: string;
  pageId: string;
  notionPageUrl: string;
}

export interface TaskData {
  title: string;
  tagName: string;
  pageId: string;
  url: string;
}
