# ADR 004: Content Scheduling and Posting Architecture

> **Status**: Proposed
> **Date**: December 2025
> **Decision Makers**: Development Team
> **Technical Area**: Infrastructure / Background Processing

---

## Context

The Content Creation Platform needs a robust system for:
1. **Scheduling** content for future publication
2. **Executing** scheduled posts at the correct time
3. **Handling failures** with retries and notifications
4. **Respecting rate limits** across multiple platforms

### Current State

```
Campaign System (ADR-003)
├── ScheduledPost entries with scheduledTime
├── Status tracking: pending → scheduled → queued → published/failed
└── No automated execution

Queue/Approve API (existing)
├── /api/queue/approve - Manual batch publishing
├── Concurrent request limiting (5 max)
├── Per-platform API calls
└── Audit logging
```

### Requirements

1. Execute scheduled posts automatically at the correct time
2. Handle platform-specific rate limits (Twitter: 300/15min, LinkedIn: 100/day)
3. Retry failed posts with exponential backoff
4. Provide visibility into scheduling queue and history
5. Support timezone-aware scheduling
6. Integrate with existing Campaign infrastructure

---

## Decision

We will implement a **Queue-Based Scheduling System** with the following components:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     SCHEDULING ARCHITECTURE                         │
│                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐          │
│  │  Campaign   │────▶│  Scheduler  │────▶│   Queue     │          │
│  │   Posts     │     │   Worker    │     │  (Redis/    │          │
│  └─────────────┘     └──────┬──────┘     │  Memory)    │          │
│                             │            └──────┬──────┘          │
│                             │                   │                  │
│                      ┌──────▼──────┐     ┌──────▼──────┐          │
│                      │   Cron/     │     │  Publisher  │          │
│                      │  Interval   │     │   Worker    │          │
│                      └─────────────┘     └──────┬──────┘          │
│                                                 │                  │
│         ┌───────────────────┬───────────────────┤                  │
│         ▼                   ▼                   ▼                  │
│    ┌─────────┐        ┌─────────┐        ┌─────────┐             │
│    │ Twitter │        │LinkedIn │        │ Other   │             │
│    │   API   │        │   API   │        │  APIs   │             │
│    └─────────┘        └─────────┘        └─────────┘             │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    MONITORING & RETRY                        │  │
│  │  • Failed post queue with exponential backoff               │  │
│  │  • Rate limit tracking per platform                         │  │
│  │  • Dead letter queue for permanent failures                 │  │
│  │  • Webhook notifications for status changes                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Rationale

1. **Decoupled Design**: Scheduling and publishing are separate concerns
2. **Reliability**: Queue ensures posts aren't lost if system restarts
3. **Scalability**: Can add more workers for high-volume scenarios
4. **Visibility**: Queue state provides debugging and monitoring
5. **Flexibility**: Easy to add new platforms or change scheduling logic

---

## Data Model

### Scheduled Job

```typescript
interface ScheduledJob {
  id: string;
  type: 'campaign_post' | 'series_promotion' | 'standalone';

  // Reference to content
  campaignId?: string;
  contentId: string;
  platformId: string;

  // Scheduling
  scheduledTime: string;        // ISO 8601
  timezone: string;

  // Execution state
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;

  // Results
  publishedAt?: string;
  publishedUrl?: string;
  error?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

type JobStatus =
  | 'pending'      // Waiting to be scheduled
  | 'scheduled'    // In the schedule queue
  | 'processing'   // Currently being published
  | 'published'    // Successfully published
  | 'failed'       // Failed, will retry
  | 'dead'         // Exceeded max retries
  | 'cancelled';   // Manually cancelled

interface JobResult {
  jobId: string;
  status: 'success' | 'failure';
  platformResponse?: {
    id: string;
    url: string;
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  executedAt: string;
}
```

### Rate Limit Tracking

```typescript
interface PlatformRateLimit {
  platformId: string;

  // Current window
  windowStart: string;
  windowDuration: number;      // seconds
  requestCount: number;
  requestLimit: number;

  // Daily limits (some platforms have these)
  dailyCount?: number;
  dailyLimit?: number;
  dailyResetAt?: string;

  // Backoff state
  isBackingOff: boolean;
  backoffUntil?: string;
}

// Platform-specific defaults
const RATE_LIMITS: Record<string, { requests: number; window: number; daily?: number }> = {
  twitter: { requests: 300, window: 900, daily: 2400 },     // 300/15min, 2400/day
  linkedin: { requests: 100, window: 86400 },               // 100/day
  facebook: { requests: 200, window: 3600 },                // 200/hour
  instagram: { requests: 200, window: 3600 },               // 200/hour
};
```

---

## Architecture

### Component Structure

```
lib/scheduler/
├── index.ts                 # Main exports
├── scheduler.ts             # Scheduling logic
├── publisher.ts             # Publishing logic
├── queue.ts                 # Queue management
├── rate-limiter.ts          # Rate limit tracking
├── retry-handler.ts         # Retry logic with backoff
└── types.ts                 # Type definitions

app/api/scheduler/
├── route.ts                 # GET scheduled jobs, POST new job
├── [id]/route.ts            # GET/DELETE specific job
├── process/route.ts         # POST trigger processing (for cron)
└── stats/route.ts           # GET scheduler statistics
```

### Scheduler Service

```typescript
// lib/scheduler/scheduler.ts

interface SchedulerConfig {
  checkInterval: number;      // How often to check for due jobs (ms)
  batchSize: number;          // Max jobs to process per cycle
  maxRetries: number;         // Default max retry attempts
  retryDelays: number[];      // Backoff delays in seconds
}

const DEFAULT_CONFIG: SchedulerConfig = {
  checkInterval: 60000,       // 1 minute
  batchSize: 50,
  maxRetries: 5,
  retryDelays: [60, 300, 900, 3600, 14400], // 1m, 5m, 15m, 1h, 4h
};

class Scheduler {
  private config: SchedulerConfig;
  private queue: JobQueue;
  private rateLimiter: RateLimiter;
  private publisher: Publisher;

  constructor(config?: Partial<SchedulerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queue = new JobQueue();
    this.rateLimiter = new RateLimiter();
    this.publisher = new Publisher();
  }

  /**
   * Schedule a new job
   */
  async schedule(job: Omit<ScheduledJob, 'id' | 'status' | 'attempts' | 'createdAt' | 'updatedAt'>): Promise<ScheduledJob> {
    const newJob: ScheduledJob = {
      ...job,
      id: generateJobId(),
      status: 'scheduled',
      attempts: 0,
      maxAttempts: job.maxAttempts || this.config.maxRetries,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.queue.add(newJob);
    return newJob;
  }

  /**
   * Process due jobs
   */
  async processDueJobs(): Promise<JobResult[]> {
    const now = new Date();
    const dueJobs = await this.queue.getDueJobs(now, this.config.batchSize);

    const results: JobResult[] = [];

    for (const job of dueJobs) {
      // Check rate limits before processing
      if (!await this.rateLimiter.canProcess(job.platformId)) {
        // Skip, will be picked up in next cycle
        continue;
      }

      const result = await this.processJob(job);
      results.push(result);
    }

    return results;
  }

  /**
   * Process a single job
   */
  private async processJob(job: ScheduledJob): Promise<JobResult> {
    await this.queue.updateStatus(job.id, 'processing');

    try {
      const publishResult = await this.publisher.publish(job);

      await this.rateLimiter.recordRequest(job.platformId);

      await this.queue.updateStatus(job.id, 'published', {
        publishedAt: new Date().toISOString(),
        publishedUrl: publishResult.url,
      });

      return {
        jobId: job.id,
        status: 'success',
        platformResponse: publishResult,
        executedAt: new Date().toISOString(),
      };
    } catch (error) {
      return await this.handleFailure(job, error);
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private async handleFailure(job: ScheduledJob, error: any): Promise<JobResult> {
    const attempts = job.attempts + 1;
    const isRetryable = this.isRetryableError(error);
    const hasRetriesLeft = attempts < job.maxAttempts;

    if (isRetryable && hasRetriesLeft) {
      const nextRetryDelay = this.config.retryDelays[attempts - 1] ||
                             this.config.retryDelays[this.config.retryDelays.length - 1];
      const nextRetryAt = new Date(Date.now() + nextRetryDelay * 1000);

      await this.queue.updateStatus(job.id, 'failed', {
        attempts,
        lastAttemptAt: new Date().toISOString(),
        nextRetryAt: nextRetryAt.toISOString(),
        error: error.message,
      });
    } else {
      // Move to dead letter queue
      await this.queue.updateStatus(job.id, 'dead', {
        attempts,
        lastAttemptAt: new Date().toISOString(),
        error: error.message,
      });

      // Notify about permanent failure
      await this.notifyFailure(job, error);
    }

    return {
      jobId: job.id,
      status: 'failure',
      error: {
        code: error.code || 'UNKNOWN',
        message: error.message,
        retryable: isRetryable && hasRetriesLeft,
      },
      executedAt: new Date().toISOString(),
    };
  }

  private isRetryableError(error: any): boolean {
    // Rate limit errors are retryable
    if (error.status === 429) return true;
    // Server errors are retryable
    if (error.status >= 500) return true;
    // Network errors are retryable
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    // Auth errors are not retryable
    if (error.status === 401 || error.status === 403) return false;
    // Bad request errors are not retryable
    if (error.status === 400) return false;

    return false;
  }
}
```

### Publisher Service

```typescript
// lib/scheduler/publisher.ts

interface PublishResult {
  id: string;
  url: string;
  platformData?: Record<string, any>;
}

class Publisher {
  private platformAdapters: Map<string, PlatformAdapter>;

  constructor() {
    this.platformAdapters = new Map([
      ['twitter', new TwitterAdapter()],
      ['linkedin', new LinkedInAdapter()],
      ['facebook', new FacebookAdapter()],
      ['instagram', new InstagramAdapter()],
    ]);
  }

  async publish(job: ScheduledJob): Promise<PublishResult> {
    const adapter = this.platformAdapters.get(job.platformId);

    if (!adapter) {
      throw new Error(`No adapter found for platform: ${job.platformId}`);
    }

    // Get content from campaign/content store
    const content = await this.getContent(job);

    // Publish using platform adapter
    return adapter.publish(content);
  }

  private async getContent(job: ScheduledJob): Promise<ContentPayload> {
    // Fetch from campaign system or content store
    if (job.campaignId) {
      return this.getCampaignContent(job.campaignId, job.contentId, job.platformId);
    }
    return this.getStandaloneContent(job.contentId);
  }
}

// Platform adapters
interface PlatformAdapter {
  publish(content: ContentPayload): Promise<PublishResult>;
  validateContent(content: ContentPayload): ValidationResult;
}

class TwitterAdapter implements PlatformAdapter {
  private client: TwitterClient;

  async publish(content: ContentPayload): Promise<PublishResult> {
    // Handle threads
    if (content.isThread && content.threadParts) {
      return this.publishThread(content);
    }

    // Single tweet
    const response = await this.client.tweets.create({
      text: content.text,
      media: content.mediaIds ? { media_ids: content.mediaIds } : undefined,
    });

    return {
      id: response.data.id,
      url: `https://twitter.com/i/web/status/${response.data.id}`,
      platformData: response.data,
    };
  }

  private async publishThread(content: ContentPayload): Promise<PublishResult> {
    const tweetIds: string[] = [];
    let replyToId: string | undefined;

    for (const part of content.threadParts!) {
      const response = await this.client.tweets.create({
        text: part.text,
        reply: replyToId ? { in_reply_to_tweet_id: replyToId } : undefined,
      });

      tweetIds.push(response.data.id);
      replyToId = response.data.id;
    }

    return {
      id: tweetIds[0],
      url: `https://twitter.com/i/web/status/${tweetIds[0]}`,
      platformData: { tweetIds },
    };
  }
}
```

### Queue Storage Options

```typescript
// lib/scheduler/queue.ts

// Option 1: In-Memory Queue (Development/Simple deployments)
class InMemoryQueue implements JobQueue {
  private jobs: Map<string, ScheduledJob> = new Map();

  async add(job: ScheduledJob): Promise<void> {
    this.jobs.set(job.id, job);
  }

  async getDueJobs(before: Date, limit: number): Promise<ScheduledJob[]> {
    const due: ScheduledJob[] = [];

    for (const job of this.jobs.values()) {
      if (
        ['scheduled', 'failed'].includes(job.status) &&
        new Date(job.scheduledTime) <= before &&
        (!job.nextRetryAt || new Date(job.nextRetryAt) <= before)
      ) {
        due.push(job);
        if (due.length >= limit) break;
      }
    }

    return due.sort((a, b) =>
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }
}

// Option 2: Redis Queue (Production)
class RedisQueue implements JobQueue {
  private redis: Redis;
  private readonly QUEUE_KEY = 'scheduler:jobs';
  private readonly DUE_SET = 'scheduler:due';

  async add(job: ScheduledJob): Promise<void> {
    const score = new Date(job.scheduledTime).getTime();

    await this.redis.multi()
      .hset(this.QUEUE_KEY, job.id, JSON.stringify(job))
      .zadd(this.DUE_SET, score, job.id)
      .exec();
  }

  async getDueJobs(before: Date, limit: number): Promise<ScheduledJob[]> {
    const score = before.getTime();
    const ids = await this.redis.zrangebyscore(this.DUE_SET, 0, score, 'LIMIT', 0, limit);

    if (ids.length === 0) return [];

    const jobData = await this.redis.hmget(this.QUEUE_KEY, ...ids);
    return jobData.filter(Boolean).map(data => JSON.parse(data!));
  }
}

// Option 3: Database Queue (Persistent, queryable)
class DatabaseQueue implements JobQueue {
  private db: PrismaClient;

  async add(job: ScheduledJob): Promise<void> {
    await this.db.scheduledJob.create({ data: job });
  }

  async getDueJobs(before: Date, limit: number): Promise<ScheduledJob[]> {
    return this.db.scheduledJob.findMany({
      where: {
        OR: [
          { status: 'scheduled', scheduledTime: { lte: before } },
          { status: 'failed', nextRetryAt: { lte: before } },
        ],
      },
      orderBy: { scheduledTime: 'asc' },
      take: limit,
    });
  }
}
```

---

## API Routes

### Schedule Management

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/scheduler` | GET | List scheduled jobs (with filters) |
| `/api/scheduler` | POST | Create new scheduled job |
| `/api/scheduler/[id]` | GET | Get job details |
| `/api/scheduler/[id]` | DELETE | Cancel scheduled job |
| `/api/scheduler/[id]/retry` | POST | Manually retry failed job |
| `/api/scheduler/process` | POST | Trigger job processing (cron endpoint) |
| `/api/scheduler/stats` | GET | Get scheduler statistics |

### Example Requests

```typescript
// Schedule a campaign post
POST /api/scheduler
{
  "type": "campaign_post",
  "campaignId": "camp_123",
  "contentId": "content_456",
  "platformId": "twitter",
  "scheduledTime": "2025-12-10T09:00:00Z",
  "timezone": "America/New_York"
}

// Get upcoming posts
GET /api/scheduler?status=scheduled&platformId=twitter&limit=20

// Get scheduler stats
GET /api/scheduler/stats
Response:
{
  "queued": 45,
  "processing": 2,
  "published_today": 128,
  "failed_today": 3,
  "rate_limits": {
    "twitter": { "remaining": 250, "reset_at": "2025-12-05T17:15:00Z" },
    "linkedin": { "remaining": 85, "reset_at": "2025-12-06T00:00:00Z" }
  }
}
```

---

## Execution Strategy

### Option A: Vercel Cron (Serverless)

```typescript
// vercel.json
{
  "crons": [
    {
      "path": "/api/scheduler/process",
      "schedule": "* * * * *"  // Every minute
    }
  ]
}

// app/api/scheduler/process/route.ts
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const scheduler = getScheduler();
  const results = await scheduler.processDueJobs();

  return NextResponse.json({
    processed: results.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'failure').length,
  });
}
```

### Option B: Background Worker (Self-hosted)

```typescript
// workers/scheduler-worker.ts
import { Scheduler } from '@/lib/scheduler';

async function runWorker() {
  const scheduler = new Scheduler();

  console.log('Scheduler worker started');

  // Process loop
  while (true) {
    try {
      const results = await scheduler.processDueJobs();

      if (results.length > 0) {
        console.log(`Processed ${results.length} jobs`);
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }

    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
}

runWorker();
```

### Option C: Hybrid (Recommended)

- Use **Vercel Cron** for triggering the process endpoint
- Use **Redis Queue** for job storage and coordination
- Use **Database** for audit trail and analytics

---

## Integration with Campaigns

### Scheduling from Campaign UI

```typescript
// hooks/useCampaign.ts - extend with scheduling

interface UseCampaignReturn {
  // ... existing methods

  // Scheduling
  scheduleContent: (campaignId: string, contentId: string, options: ScheduleOptions) => Promise<void>;
  bulkSchedule: (campaignId: string, schedule: BulkScheduleConfig) => Promise<void>;
  getScheduledPosts: (campaignId: string) => ScheduledJob[];
  cancelScheduledPost: (jobId: string) => Promise<void>;
}

interface ScheduleOptions {
  platformId: string;
  scheduledTime: Date;
  timezone?: string;
}

interface BulkScheduleConfig {
  contentIds: string[];
  platforms: string[];
  startDate: Date;
  frequency: 'hourly' | 'daily' | 'weekly';
  bestTimes?: string[];
}
```

### Campaign Content Publishing Flow

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   Campaign   │     │   Schedule    │     │   Publish    │
│   Content    │────▶│   Builder     │────▶│   Preview    │
│   Editor     │     │   (Calendar)  │     │   & Confirm  │
└──────────────┘     └───────────────┘     └──────┬───────┘
                                                   │
                                                   ▼
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   Monitor    │◀────│   Scheduler   │◀────│   Job Queue  │
│   Dashboard  │     │   Worker      │     │              │
└──────────────┘     └───────────────┘     └──────────────┘
```

---

## Monitoring & Alerts

### Webhook Notifications

```typescript
interface WebhookEvent {
  type: 'job.published' | 'job.failed' | 'job.dead' | 'rate_limit.reached';
  timestamp: string;
  data: {
    jobId?: string;
    campaignId?: string;
    platformId?: string;
    error?: string;
  };
}

// Configure webhooks
POST /api/scheduler/webhooks
{
  "url": "https://hooks.slack.com/services/...",
  "events": ["job.failed", "job.dead", "rate_limit.reached"]
}
```

### Metrics & Dashboard

```typescript
interface SchedulerMetrics {
  // Queue health
  queueDepth: number;
  oldestJob: Date | null;

  // Performance
  avgProcessingTime: number;
  jobsPerMinute: number;

  // Results (24h)
  publishedCount: number;
  failedCount: number;
  retriedCount: number;
  deadCount: number;

  // By platform
  platformStats: Record<string, {
    published: number;
    failed: number;
    avgLatency: number;
  }>;
}
```

---

## Migration & Rollout

### Phase 1: Foundation
- [ ] Create scheduler types and interfaces
- [ ] Implement in-memory queue for development
- [ ] Add `/api/scheduler` routes
- [ ] Unit tests for scheduler logic

### Phase 2: Publishing
- [ ] Implement platform adapters (Twitter, LinkedIn)
- [ ] Add rate limiting logic
- [ ] Implement retry handler with backoff
- [ ] Integration tests with mock APIs

### Phase 3: Production
- [ ] Add Redis queue implementation
- [ ] Configure Vercel Cron
- [ ] Set up monitoring and alerts
- [ ] Add scheduler dashboard UI

### Phase 4: Campaign Integration
- [ ] Connect Campaign UI to scheduler
- [ ] Add bulk scheduling feature
- [ ] Calendar view for schedule visualization
- [ ] Analytics integration

---

## Consequences

### Positive

- **Reliable**: Queue ensures no scheduled posts are lost
- **Scalable**: Can handle high volumes with proper queue backend
- **Observable**: Full visibility into job states and history
- **Resilient**: Automatic retries handle transient failures
- **Platform-aware**: Respects rate limits per platform

### Negative

- **Complexity**: More moving parts than direct publishing
- **Infrastructure**: Requires Redis or similar for production
- **Cost**: Background processing may increase hosting costs
- **Latency**: Jobs may be delayed if queue is busy

### Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Missed schedules | Medium | High | Monitoring, alerts, redundant workers |
| Rate limit exhaustion | High | Medium | Conservative limits, backoff, user warnings |
| Platform API changes | Medium | High | Adapter pattern, version pinning, tests |
| Queue data loss | Low | High | Persistent storage, backups |

---

## Security Considerations

1. **API Keys**: Platform API keys stored in environment variables only
2. **Cron Endpoint**: Protected with shared secret
3. **Job Data**: No sensitive content stored in queue (only references)
4. **Audit Trail**: All publishing actions logged
5. **Rate Limits**: Prevent abuse through platform and internal limits

---

## Related Documents

- [ADR 003: Campaign and Series Integration](./003-campaign-series-integration.md)
- [ADR 002: Airtable Backend](./002-airtable-backend.md)
- Platform Configuration: `lib/config/platforms.ts`
- Existing Queue API: `app/api/queue/approve/route.ts`

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2025-12 | Development Team | Initial proposal |
