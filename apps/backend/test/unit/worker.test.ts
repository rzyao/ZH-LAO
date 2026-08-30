import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { WorkerHost } from '../../src/jobs/worker-host.js';

describe('worker host', () => {
  it('starts and stops empty or abortable work', async () => {
    const empty = new WorkerHost([], pino({ level: 'silent' })); empty.start(); await empty.stop();
    const stopped = vi.fn();
    const host = new WorkerHost([{ name: 'probe', run: (signal) => new Promise<void>((resolve) => signal.addEventListener('abort', () => { stopped(); resolve(); })) }], pino({ level: 'silent' }));
    host.start(); await host.stop(); expect(stopped).toHaveBeenCalledOnce();
  });
});
