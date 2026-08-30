import pg from 'pg';

const { Client } = pg;

export const BUSINESS_SCHEMAS = [
  'identity',
  'content',
  'learning',
  'social',
  'chat',
  'audio',
  'commerce',
  'rewards',
  'trust',
  'operations',
  'platform',
];

export function requireDatabaseUrl(name = 'DATABASE_URL') {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export async function withClient(connectionString, fn) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}
