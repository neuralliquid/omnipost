/**
 * Job Queue Implementation
 * In-memory queue for development, with interface for Redis/DB backends
 */

import { JobQueue, ScheduledJob, JobStatus } from './types';
import { generateJobId as generateSecureJobId } from '@/lib/utils/id';

const STORAGE_KEY = 'scheduler-jobs';

/**
 * Load jobs from localStorage
 */
function loadFromStorage(): Map<string, ScheduledJob> {
  if (typeof window === 'undefined') {
    return new Map();
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const jobs: ScheduledJob[] = JSON.parse(stored);
      return new Map(jobs.map(job => [job.id, job]));
    }
  } catch (error) {
    console.error('Error loading jobs from storage:', error);
  }
  return new Map();
}

/**
 * Save jobs to localStorage
 */
function saveToStorage(jobs: Map<string, ScheduledJob>): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const jobArray = Array.from(jobs.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobArray));
  } catch (error) {
    console.error('Error saving jobs to storage:', error);
  }
}

/**
 * In-Memory Job Queue
 * Persists to localStorage for development
 */
export class InMemoryQueue implements JobQueue {
  private jobs: Map<string, ScheduledJob>;
  private initialized: boolean = false;

  constructor() {
    this.jobs = new Map();
  }

  private ensureInitialized(): void {
    if (!this.initialized && typeof window !== 'undefined') {
      this.jobs = loadFromStorage();
      this.initialized = true;
    }
  }

  private persist(): void {
    saveToStorage(this.jobs);
  }

  async add(job: ScheduledJob): Promise<void> {
    this.ensureInitialized();
    this.jobs.set(job.id, job);
    this.persist();
  }

  async get(id: string): Promise<ScheduledJob | null> {
    this.ensureInitialized();
    return this.jobs.get(id) || null;
  }

  async update(id: string, updates: Partial<ScheduledJob>): Promise<void> {
    this.ensureInitialized();
    const job = this.jobs.get(id);
    if (job) {
      this.jobs.set(id, {
        ...job,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      this.persist();
    }
  }

  async remove(id: string): Promise<void> {
    this.ensureInitialized();
    this.jobs.delete(id);
    this.persist();
  }

  async getDueJobs(before: Date, limit: number): Promise<ScheduledJob[]> {
    this.ensureInitialized();
    const due: ScheduledJob[] = [];
    const beforeTime = before.getTime();

    for (const job of this.jobs.values()) {
      // Check if job is due
      const isDue =
        (job.status === 'scheduled' && new Date(job.scheduledTime).getTime() <= beforeTime) ||
        (job.status === 'failed' &&
          job.nextRetryAt &&
          new Date(job.nextRetryAt).getTime() <= beforeTime);

      if (isDue) {
        due.push(job);
        if (due.length >= limit) break;
      }
    }

    // Sort by scheduled time
    return due.sort(
      (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }

  async getByStatus(status: JobStatus, limit?: number): Promise<ScheduledJob[]> {
    this.ensureInitialized();
    const filtered: ScheduledJob[] = [];

    for (const job of this.jobs.values()) {
      if (job.status === status) {
        filtered.push(job);
        if (limit && filtered.length >= limit) break;
      }
    }

    return filtered.sort(
      (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }

  async getByCampaign(campaignId: string): Promise<ScheduledJob[]> {
    this.ensureInitialized();
    const filtered: ScheduledJob[] = [];

    for (const job of this.jobs.values()) {
      if (job.campaignId === campaignId) {
        filtered.push(job);
      }
    }

    return filtered.sort(
      (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }

  async getAll(): Promise<ScheduledJob[]> {
    this.ensureInitialized();
    return Array.from(this.jobs.values()).sort(
      (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }

  async count(): Promise<number> {
    this.ensureInitialized();
    return this.jobs.size;
  }

  async clear(): Promise<void> {
    this.jobs.clear();
    this.persist();
  }
}

// Server-side in-memory queue (no localStorage)
class ServerMemoryQueue implements JobQueue {
  private jobs: Map<string, ScheduledJob> = new Map();

  async add(job: ScheduledJob): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async get(id: string): Promise<ScheduledJob | null> {
    return this.jobs.get(id) || null;
  }

  async update(id: string, updates: Partial<ScheduledJob>): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      this.jobs.set(id, {
        ...job,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  async remove(id: string): Promise<void> {
    this.jobs.delete(id);
  }

  async getDueJobs(before: Date, limit: number): Promise<ScheduledJob[]> {
    const due: ScheduledJob[] = [];
    const beforeTime = before.getTime();

    for (const job of this.jobs.values()) {
      const isDue =
        (job.status === 'scheduled' && new Date(job.scheduledTime).getTime() <= beforeTime) ||
        (job.status === 'failed' &&
          job.nextRetryAt &&
          new Date(job.nextRetryAt).getTime() <= beforeTime);

      if (isDue) {
        due.push(job);
        if (due.length >= limit) break;
      }
    }

    return due.sort(
      (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }

  async getByStatus(status: JobStatus, limit?: number): Promise<ScheduledJob[]> {
    const filtered: ScheduledJob[] = [];

    for (const job of this.jobs.values()) {
      if (job.status === status) {
        filtered.push(job);
        if (limit && filtered.length >= limit) break;
      }
    }

    return filtered.sort(
      (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }

  async getByCampaign(campaignId: string): Promise<ScheduledJob[]> {
    const filtered: ScheduledJob[] = [];

    for (const job of this.jobs.values()) {
      if (job.campaignId === campaignId) {
        filtered.push(job);
      }
    }

    return filtered.sort(
      (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }

  async getAll(): Promise<ScheduledJob[]> {
    return Array.from(this.jobs.values());
  }

  async count(): Promise<number> {
    return this.jobs.size;
  }

  async clear(): Promise<void> {
    this.jobs.clear();
  }
}

// Singleton instances
let clientQueue: InMemoryQueue | null = null;
let serverQueue: ServerMemoryQueue | null = null;

/**
 * Get the appropriate queue instance
 */
export function getQueue(): JobQueue {
  if (typeof window !== 'undefined') {
    // Client-side: use localStorage-backed queue
    if (!clientQueue) {
      clientQueue = new InMemoryQueue();
    }
    return clientQueue;
  } else {
    // Server-side: use memory-only queue
    if (!serverQueue) {
      serverQueue = new ServerMemoryQueue();
    }
    return serverQueue;
  }
}

/**
 * Generate unique job ID
 * NOTE: Uses Math.random() intentionally - these IDs are for internal job
 * queue management only, not security-sensitive operations. The timestamp
 * prefix ensures uniqueness for practical purposes.
 */
export function generateJobId(): string {
  return generateSecureJobId();
}
