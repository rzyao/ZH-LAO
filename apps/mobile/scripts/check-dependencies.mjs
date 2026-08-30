/**
 * MOB-F22 dependency audit.
 * Verifies the dependency surface of the V2 Mobile Foundation.
 * Exit code 0 = PASS, 1 = FAIL.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const all = { ...pkg.dependencies, ...pkg.devDependencies };
const names = Object.keys(all);

const checks = [
  ['expo-av', 'expo-av must be 0 (replaced by expo-audio)'],
  ['expo-router', 'Expo Router is forbidden (React Navigation only)'],
  ['expo-sqlite', 'SQLite / offline-first is out of Foundation scope'],
  ['react-native-mmkv', 'MMKV is not part of the V2 storage stack'],
  ['zustand', 'Zustand is not included by default'],
  ['react-redux', 'Redux is not part of the frozen stack'],
  ['@tanstack/react-query-devtools', 'no devtools in the dependency surface'],
  ['detox', 'Detox is forbidden (Maestro is the e2e tool)'],
];

let failed = false;
for (const [name, message] of checks) {
  const present = names.filter((n) => n === name || n.startsWith(`${name}/`));
  const status = present.length === 0 ? 'PASS' : 'FAIL';
  if (present.length > 0) failed = true;
  console.log(`[${status}] ${name} (${present.length}): ${message}`);
}

// Duplicate navigation / server-state / http client detection via top-level installs.
const navLibs = names.filter((n) => n.includes('react-navigation'));
const serverState = names.filter((n) => n.includes('react-query') || n.includes('swr'));
const httpClients = names.filter((n) => n === 'axios' || n.includes('apisauce') || n === 'fetch-intercept');
console.log(`\nReact Navigation packages (expect >= 3 core): ${navLibs.join(', ')}`);
console.log(`Server-state packages (expect only @tanstack/react-query): ${serverState.join(', ')}`);
console.log(`HTTP clients (expect only axios): ${httpClients.join(', ')}`);

const largeUI = names.filter((n) => /paper|elements|native-base|react-native-ui-lib|@gluestack/.test(n));
const status2 = largeUI.length === 0 ? 'PASS' : 'FAIL';
if (largeUI.length > 0) failed = true;
console.log(`[${status2}] Large duplicate UI frameworks (${largeUI.length})`);

console.log(failed ? '\nDEPENDENCY AUDIT: FAIL' : '\nDEPENDENCY AUDIT: PASS');
process.exit(failed ? 1 : 0);
