import type { Logger } from 'pino';
import type { Job } from './job.js';

export class WorkerHost {
  private controller: AbortController | undefined;
  private running: Promise<void>[] = [];
  constructor(private readonly jobs: readonly Job[], private readonly logger: Logger) {}
  start(): void {
    if (this.controller) throw new Error('Worker host already started');
    this.controller = new AbortController();
    this.running = this.jobs.map((job) => this.runJob(job, this.controller!.signal));
    this.logger.info({ jobCount: this.jobs.length }, 'Worker host started');
  }
  private async runJob(job: Job, signal: AbortSignal): Promise<void> {
    try { await job.run(signal); }
    catch (error) { if (!signal.aborted) this.logger.error({ err: error, jobName: job.name }, 'Background job stopped unexpectedly'); }
  }
  async stop(): Promise<void> {
    if (!this.controller) return;
    this.controller.abort();
    await Promise.allSettled(this.running);
    this.controller = undefined;
    this.running = [];
    this.logger.info('Worker host stopped');
  }
}

export function pollingJob(name: string, intervalMs: number, action: (signal: AbortSignal) => Promise<void>): Job {
  return { name, async run(signal) {
    while (!signal.aborted) {
      await action(signal);
      if (signal.aborted) break;
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, intervalMs);
        signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
      });
    }
  } };
}
