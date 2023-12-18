export interface FolderData {
  MasterFolder: {
    FolderName: string;
    PageId: string;
    SubFolder: {
      FolderName: string;
      PageId: string;
    }[];
  };
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
  Folder: FolderData[];
  Tag: TagData[];
}
