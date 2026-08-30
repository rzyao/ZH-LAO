export interface ObjectStorage {
  put(key: string, content: Uint8Array, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
}
