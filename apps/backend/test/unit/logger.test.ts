import { PassThrough } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { loggerOptions } from '../../src/logging/logger.js';

describe('logger', () => {
  it('emits structured JSON and redacts secrets', async () => {
    const stream = new PassThrough(); let output = ''; stream.on('data', (chunk) => { output += chunk.toString(); });
    const logger = pino(loggerOptions, stream);
    logger.info({ password: 'hidden', req: { headers: { authorization: 'Bearer hidden' } } }, 'test');
    await new Promise((resolve) => setImmediate(resolve));
    expect(() => JSON.parse(output)).not.toThrow(); expect(output).not.toContain('Bearer hidden'); expect(output).not.toContain('"hidden"');
  });
});
