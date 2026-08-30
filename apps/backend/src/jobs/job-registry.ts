import type { Job } from './job.js';

export class JobRegistry {
  private readonly jobs = new Map<string, Job>();
  register(job: Job): void {
    if (this.jobs.has(job.name)) throw new Error(`Job already registered: ${job.name}`);
    this.jobs.set(job.name, job);
  }
  all(): readonly Job[] { return [...this.jobs.values()]; }
}
