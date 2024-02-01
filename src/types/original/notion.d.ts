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
