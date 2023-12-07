export interface Folder {
  folderName: string;
  pageId: string;
}

export interface Tag {
  tagName: string;
  pageId: string;
  masterFolder: Folder;
  subFolder: Folder;
}

export interface NotionLibraryData {
  Folder: Folder[];
  Tag: Tag[];
}
