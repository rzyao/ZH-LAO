import { createHash } from 'node:crypto';

const UUID_NAMESPACE = '6c5796f3-246f-515b-ae53-b5c48cfe4e94';

export function normalizeLaoText(value) {
  return String(value ?? '').normalize('NFC').trim();
}

export function stableMigrationUuid(type, sourceId) {
  const namespace = Buffer.from(UUID_NAMESPACE.replaceAll('-', ''), 'hex');
  const digest = createHash('sha1').update(Buffer.concat([namespace, Buffer.from(`study-lao:${type}:${sourceId}`)])).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  return `${digest.subarray(0, 4).toString('hex')}-${digest.subarray(4, 6).toString('hex')}-${digest.subarray(6, 8).toString('hex')}-${digest.subarray(8, 10).toString('hex')}-${digest.subarray(10, 16).toString('hex')}`;
}

export function stableLegacyLetterUuid(sourceId) {
  const namespace = Buffer.from('e9192b2a22c45d0a9b9b2d5d7a4e1b11', 'hex');
  const digest = createHash('sha1').update(Buffer.concat([namespace, Buffer.from(`study-lao:app_letter:${sourceId}`)])).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  return `${digest.subarray(0, 4).toString('hex')}-${digest.subarray(4, 6).toString('hex')}-${digest.subarray(6, 8).toString('hex')}-${digest.subarray(8, 10).toString('hex')}-${digest.subarray(10, 16).toString('hex')}`;
}

export function selectCanonicalRecords(records) {
  const groups = new Map();
  for (const record of records) {
    const key = `${record.type}:${normalizeLaoText(record.text)}`;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  const canonical = [];
  const isolated = [];
  for (const group of groups.values()) {
    group.sort((a, b) => (BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0));
    canonical.push(group[0]);
    for (const record of group.slice(1)) isolated.push({ ...record, canonicalSourceId: group[0].id, reason: 'duplicate_normalized_text' });
  }
  return { canonical, isolated };
}
