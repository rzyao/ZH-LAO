import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.argv[2] ?? 'src');
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.mjs']);
const errors = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}

for (const file of await walk(root)) {
  if (!sourceExtensions.has(path.extname(file))) continue;
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');
  if (relative.startsWith('modules/')) {
    const [, owner] = relative.split('/');
    for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const specifier = match[1];
      const resolvedSpecifier = specifier?.startsWith('.')
        ? path.relative(root, path.resolve(path.dirname(file), specifier)).replaceAll('\\', '/')
        : specifier;
      const domainMatch = resolvedSpecifier?.match(/(?:^|\/)modules\/([^/]+)\/(.+)/);
      if (domainMatch && domainMatch[1] !== owner && !domainMatch[2]?.startsWith('public/')) errors.push(`${relative}: cross-domain import must target public/: ${specifier}`);
    }
    if (/\bnew\s+Pool\s*\(/.test(source) || /from\s+['"]pg['"]/.test(source)) errors.push(`${relative}: business modules must not construct or import pg Pool`);
    if (relative.includes('/http/') && /\.query\s*\(/.test(source)) errors.push(`${relative}: HTTP adapters must not execute SQL`);
  }
  if (!relative.startsWith('modules/') && relative !== 'main.ts' && relative !== 'worker.ts' && /from\s+['"].*modules\//.test(source)) errors.push(`${relative}: shared technical code must not depend on business modules`);
  if (/database\/v2\/migrations|\bCREATE\s+(?:TABLE|SCHEMA)\b/i.test(source)) errors.push(`${relative}: application source must not manage the frozen schema`);
}

if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else process.stdout.write('Architecture boundaries: PASS\n');
