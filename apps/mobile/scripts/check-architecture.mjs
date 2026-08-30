/**
 * MOB-F22 architecture audit.
 * Verifies structural rules of the V2 Mobile Foundation by scanning src/.
 * Exit code 0 = PASS, 1 = FAIL.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { walk } from './lib/walk.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'src');

const failures = [];
const results = [];

function scan(pattern, label, { exclude = [] } = {}) {
  const hits = [];
  for (const file of walk(SRC)) {
    if (exclude.some((x) => file.replaceAll('\\', '/').includes(x))) continue;
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (pattern.test(line)) {
        hits.push(`${relative(ROOT, file)}:${i + 1}`);
      }
    });
  }
  return hits;
}

// 1. Screens must not talk to axios / fetch directly.
// The transport layer (src/api) is the single owner of axios; everything else
// must route through the V2 HTTP client.
const screenAxios = scan(/\baxios\b/, 'screen axios', { exclude: ['api/'] });
const screenFetch = scan(/\bfetch\s*\(/, 'screen fetch');
results.push(['Screen -> axios', screenAxios.length, screenAxios]);
results.push(['Screen -> fetch', screenFetch.length, screenFetch]);

// 2. Refresh token must never touch AsyncStorage.
const refreshAsync = scan(/AsyncStorage[\s\S]{0,200}refresh/i, 'refresh token in AsyncStorage');
results.push(['Refresh token in AsyncStorage', refreshAsync.length, refreshAsync]);

// 3. Internal BIGINT / numeric id contracts.
const bigintContract = scan(
  /(?:id\s*:\s*(?:number|bigint))|(?:\bid\s*:\s*number\b)/i,
  'internal id contract',
  { exclude: ['contracts/uuid.ts', 'contracts/pagination.ts', 'api/'] },
);
results.push(['Internal BIGINT contract', bigintContract.length, bigintContract]);

// 4. Old backend contract markers (code === 1000 / 9401 / /api/app/auth/refresh).
const oldContract = scan(
  /code\s*===\s*(?:1000|9401)|\/api\/app\/auth\/refresh/,
  'old backend contract',
);
results.push(['Old backend contract', oldContract.length, oldContract]);

// 5. Guessed chat protocol (typing/presence/read receipt) outside realtime skeleton.
const chatProtocol = scan(
  /(?:typing|presence|readReceipt|deliveryReceipt)\s*[:=]|interface\s+(?:Typing|Presence|ReadReceipt)/i,
  'guessed chat protocol',
  { exclude: ['realtime/types.ts', 'realtime/realtimeClient.ts', 'features/foundation'] },
);
results.push(['Chat protocol guessed', chatProtocol.length, chatProtocol]);

// 6. Offline sync / conflict engines.
const offlineEngine = scan(
  /(?:offlineStore|syncEngine|conflictResolver)\s*[:=]|WatermelonDB|new\s+Realm\s*\(/i,
  'offline engine',
  { exclude: ['api/query'] },
);
results.push(['Offline sync engine', offlineEngine.length, offlineEngine]);

let failed = false;
for (const [label, count, hits] of results) {
  const status = count === 0 ? 'PASS' : 'FAIL';
  if (count > 0) failed = true;
  console.log(`[${status}] ${label}: ${count}`);
  for (const hit of hits.slice(0, 10)) console.log(`        ${hit}`);
  if (hits.length > 10) console.log(`        ... and ${hits.length - 10} more`);
  failures.push(status);
}

console.log(failed ? '\nARCHITECTURE AUDIT: FAIL' : '\nARCHITECTURE AUDIT: PASS');
process.exit(failed ? 1 : 0);
