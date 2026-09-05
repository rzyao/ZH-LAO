import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { ObjectStorageMetadata, ObjectStoragePort, ObjectStorageStat } from '../../../assets/object-storage.js';

export type R2ObjectStorageOptions = Readonly<{
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}>;

/** Cloudflare R2 uses the S3 API, while its configuration stays inside infrastructure. */
export class R2ObjectStorage implements ObjectStoragePort {
  readonly name = 'cloudflare-r2';
  private readonly client: S3Client;

  constructor(private readonly options: R2ObjectStorageOptions) {
    this.client = new S3Client({
      endpoint: options.endpoint,
      region: 'auto',
      forcePathStyle: true,
      credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
    });
  }

  async put(key: string, content: Uint8Array, contentType: string, options?: Readonly<{ metadata?: ObjectStorageMetadata }>): Promise<void> {
    await this.client.send(new PutObjectCommand({ Bucket: this.options.bucket, Key: key, Body: content, ContentType: contentType, Metadata: options?.metadata }));
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key }));
  }

  async stat(key: string): Promise<ObjectStorageStat | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.options.bucket, Key: key }));
      return { key, contentType: result.ContentType ?? 'application/octet-stream', sizeBytes: result.ContentLength ?? 0, metadata: result.Metadata ?? {} };
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && '$metadata' in error && (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return null;
      throw error;
    }
  }

  async createSignedReadUrl(key: string, expiresInSeconds: number): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.options.bucket, Key: key }), { expiresIn: expiresInSeconds });
  }
}
