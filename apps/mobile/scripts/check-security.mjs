/**
 * MOB-F22 security audit.
 * Verifies credential handling rules of the V2 Mobile Foundation.
 * Exit code 0 = PASS, 1 = FAIL.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { walk } from './lib/walk.mjs';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const SRC = join(ROOT, 'src');

const failures = [];
const results = [];

function scanLines(pattern, label) {
  const hits = [];
  for (const file of walk(SRC)) {
    const content = readFileSync(file, 'utf8');
    content.split('\n').forEach((line, i) => {
      if (pattern.test(line)) {
        hits.push(`${file.replace(ROOT, '').replace(/^[\\/]/, '')}:${i + 1}`);
      }
    });
  }
  return hits;
}

// 1. Refresh token must never be written to AsyncStorage.
const refreshAsync = scanLines(
  /AsyncStorage\s*\.\s*(?:set|multiSet|merge)Item\s*\([^)]*refresh|preferencesStorage\s*\.\s*set(?:String|Json)\s*\([^)]*refresh/i,
  'refresh token via AsyncStorage',
);
results.push(['Refresh token in AsyncStorage', refreshAsync.length, refreshAsync]);

// 2. Tokens must never be logged.
const tokenLog = scanLines(
  /log\.(debug|info|warn|error)\([^)]*\b(?:accessToken|refreshToken|authorizationHeader|bearerToken)\b[^)]*\)/i,
  'token / authorization logging',
);
results.push(['Token / Authorization logs', tokenLog.length, tokenLog]);

// 3. Hardcoded secrets / private keys.
const hardcodedSecret = scanLines(
  /(api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{16,}|secret\s*[:=]\s*['"][A-Za-z0-9]{16,}|-----BEGIN (?:RSA |EC |)PRIVATE KEY-----)/,
  'hardcoded secret',
);
results.push(['Hardcoded secrets', hardcodedSecret.length, hardcodedSecret]);

// 4. Hardcoded developer machine IPs.
const hardcodedIp = scanLines(
  /192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|localhost:\d{4}/,
  'hardcoded dev IP',
);
results.push(['Hardcoded developer IP', hardcodedIp.length, hardcodedIp]);

// 5. Access token persisted to disk anywhere.
const accessPersist = scanLines(
  /SecureStore[^{]{0,200}access|setItem\s*\([^)]*access_token/i,
  'persistent access token',
  // tokenStore legitimately holds access token in MEMORY only; secure store
  // keys are refresh_token / session_metadata.
);
results.push(['Persistent access token (plaintext)', accessPersist.length, accessPersist]);

let failed = false;
for (const [label, count, hits] of results) {
  const status = count === 0 ? 'PASS' : 'FAIL';
  if (count > 0) failed = true;
  console.log(`[${status}] ${label}: ${count}`);
  for (const hit of hits.slice(0, 10)) console.log(`        ${hit}`);
  failures.push(status);
}

console.log(failed ? '\nSECURITY AUDIT: FAIL' : '\nSECURITY AUDIT: PASS');
process.exit(failed ? 1 : 0);
