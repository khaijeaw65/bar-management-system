export interface PresignedUpload {
  url: string;
  fields: Record<string, string>;
  key: string;
}

export interface StoredObject {
  size: number;
  contentType: string | undefined;
}
