/**
 * MOB-F22 scope audit.
 * Verifies the Foundation did not sneak in real Domain business integration.
 * Exit code 0 = PASS, 1 = FAIL.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { walk } from './lib/walk.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'src');

const results = [];

function scan(pattern, label, exclude = []) {
  const hits = [];
  for (const file of walk(SRC)) {
    const rel = file.replaceAll('\\', '/');
    if (exclude.some((x) => rel.includes(x))) continue;
    const content = readFileSync(file, 'utf8');
    content.split('\n').forEach((line, i) => {
      if (pattern.test(line)) {
        hits.push(`${file.replace(ROOT, '').replace(/^[\\/]/, '')}:${i + 1}`);
      }
    });
  }
  return hits;
}

// Real Domain API endpoints (identity/otp/session/content/learning/social/chat/commerce/rewards/trust).
const domainApi = scan(
  /(api\/v1\/|api\/app\/)(identity|auth|otp|refresh|session|content|learning|social|chat|commerce|rewards|trust)/i,
  'real domain API integration',
  ['api/client', 'api/errors', 'api/contracts', 'auth/session/identityAdapter.ts'],
);
results.push(['Real Domain APIs integrated', domainApi.length, domainApi]);

// Invented endpoints (any /api/ path that is not an explicit contract placeholder).
const invented = scan(
  /['"`]\/api\/[a-z0-9/_-]+['"`]/i,
  'business API guessing',
  ['api/client/types.ts', 'api/client/httpClient.ts', 'identityAdapter.ts'],
);
results.push(['Business API guessing', invented.length, invented]);

// Fake CRUD screens against non-existent endpoints.
const fakeCrud = scan(
  /useQuery\s*\(\s*\[[^\]]*\]\s*,\s*\(\)\s*=>\s*[^)]*\.(get|post|put|patch|delete)\s*\(/,
  'fake CRUD via query hooks',
);
results.push(['Fake CRUD', fakeCrud.length, fakeCrud]);

// Chat protocol / message models.
const chatProtocol = scan(
  /chatMessage|messageProtocol|sendMessage\s*\(|(?:typing|presence|readReceipt)\s*[:=]/i,
  'chat protocol',
  ['realtime/types.ts', 'realtime/realtimeClient.ts', 'features/foundation'],
);
results.push(['Chat Protocol', chatProtocol.length, chatProtocol]);

// Offline-first engines.
const offline = scan(
  /sqlite|WatermelonDB|Realm|offlineStore|syncEngine|conflictResolution/i,
  'offline-first engine',
  ['api/contracts', 'storage/preferencesStorage.ts'],
);
results.push(['Offline-first Engine', offline.length, offline]);

let failed = false;
for (const [label, count, hits] of results) {
  const status = count === 0 ? 'PASS' : 'FAIL';
  if (count > 0) failed = true;
  console.log(`[${status}] ${label}: ${count}`);
  for (const hit of hits.slice(0, 10)) console.log(`        ${hit}`);
}

console.log(failed ? '\nSCOPE AUDIT: FAIL' : '\nSCOPE AUDIT: PASS');
process.exit(failed ? 1 : 0);
