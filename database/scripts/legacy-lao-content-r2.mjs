export function validateR2Config(env = process.env) {
  const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_DOMAIN', 'R2_ENDPOINT'];
  if (String(env.STORAGE_DRIVER ?? '').toLowerCase() !== 'r2') throw new Error('STORAGE_DRIVER must be r2');
  for (const key of required) if (!env[key]) throw new Error(`${key} is required`);
  return {
    storageProvider: 'r2', storageBucket: env.R2_BUCKET_NAME,
    publicDomain: new URL(env.R2_PUBLIC_DOMAIN).origin,
    endpoint: new URL(env.R2_ENDPOINT).origin,
    accountId: env.R2_ACCOUNT_ID, accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  };
}

function clientFor(config) {
  return new S3Client({ region: 'auto', endpoint: config.endpoint, forcePathStyle: true, credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } });
}

export async function copyR2Object(sourceUrl, destinationKey, config) {
  const source = parseR2PublicUrl(sourceUrl, config);
  const client = clientFor(config);
  try { await client.send(new HeadObjectCommand({ Bucket: config.storageBucket, Key: destinationKey })); return `${config.publicDomain}/${destinationKey}`; } catch (error) { if (error.name !== 'NotFound' && error.$metadata?.httpStatusCode !== 404) throw error; }
  await client.send(new CopyObjectCommand({ Bucket: config.storageBucket, Key: destinationKey, CopySource: `${config.storageBucket}/${encodeURIComponent(source.storageKey).replaceAll('%2F', '/')}` }));
  return `${config.publicDomain}/${destinationKey}`;
}

export function parseR2PublicUrl(value, config) {
  const url = new URL(value);
  if (url.origin !== config.publicDomain || url.search || url.hash) throw new Error(`Unconfirmed R2 public URL: ${value}`);
  const storageKey = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!storageKey) throw new Error(`R2 URL has no object key: ${value}`);
  return { storageProvider: config.storageProvider, storageBucket: config.storageBucket, storageKey };
}

export async function confirmR2Object(publicUrl, config, fetchImpl = fetch) {
  const mapping = parseR2PublicUrl(publicUrl, config);
  const response = await fetchImpl(publicUrl, { method: 'HEAD' });
  if (!response.ok) throw new Error(`R2 object is unavailable (${response.status}): ${publicUrl}`);
  return { ...mapping, mimeType: response.headers.get('content-type') ?? 'audio/mpeg', sizeBytes: Number(response.headers.get('content-length') ?? 0) };
}

export async function inspectWavObject(publicUrl, config, fetchImpl = fetch) {
  const mapping = parseR2PublicUrl(publicUrl, config);
  let response; let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { response = await fetchImpl(publicUrl, { headers: { Range: 'bytes=0-127' } }); break; } catch (error) { lastError = error; await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1))); }
  }
  if (!response) throw lastError;
  if (!response.ok) throw new Error(`R2 object is unavailable (${response.status}): ${publicUrl}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (start, length) => String.fromCharCode(...bytes.subarray(start, start + length));
  if (bytes.length < 44 || ascii(0, 4) !== 'RIFF' || ascii(8, 4) !== 'WAVE' || ascii(12, 4) !== 'fmt ') throw new Error(`R2 object is not a supported WAV file: ${publicUrl}`);
  const byteRate = view.getUint32(28, true);
  let offset = 12; let dataSize;
  while (offset + 8 <= bytes.length) {
    const size = view.getUint32(offset + 4, true);
    if (ascii(offset, 4) === 'data') { dataSize = size; break; }
    offset += 8 + size + (size % 2);
  }
  if (!byteRate || !dataSize) throw new Error(`WAV duration metadata is unavailable: ${publicUrl}`);
  const totalSize = response.headers.get('content-range')?.match(/\/(\d+)$/)?.[1] ?? response.headers.get('content-length') ?? '0';
  return { ...mapping, mimeType: 'audio/wav', sizeBytes: Number(totalSize), durationMs: Math.max(1, Math.round((dataSize / byteRate) * 1000)), sampleRateHz: view.getUint32(24, true), channels: view.getUint16(22, true) };
}
import { CopyObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
