export interface PhotoItem {
  id: number;
  modificationId: number;
  originalFilename: string;
  contentType: string;
  size: number;
  caption?: string;
  contentUrl: string;
  createdAt: string;
}

export interface NoteItem {
  id: number;
  modificationId: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
}
