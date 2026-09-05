import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function writeIsolationReport(path, entries) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2)}\n`, 'utf8');
  return path;
}

export async function writeMigrationReport(path, report) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify({ generatedAt: new Date().toISOString(), ...report }, null, 2)}\n`, 'utf8');
  return path;
}
