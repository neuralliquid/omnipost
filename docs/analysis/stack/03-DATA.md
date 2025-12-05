# Data & Storage Technology Stack

> **Layer**: Data & Storage
> **Technologies**: Airtable (external), JSON files, in-memory stores
> **Last Updated**: December 2025

---

## Overview

The Content Creation Platform uses a combination of external services and local storage mechanisms. Airtable serves as the primary content database, while JSON files and in-memory stores handle configuration and runtime data.

---

## Storage Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │    AIRTABLE      │  │   FILE STORAGE   │  │  IN-MEMORY    │ │
│  │   (External)     │  │    (Local)       │  │   (Runtime)   │ │
│  ├──────────────────┤  ├──────────────────┤  ├───────────────┤ │
│  │ • Content        │  │ • Feature Flags  │  │ • Rate Limits │ │
│  │ • Tracking       │  │   (JSON)         │  │ • Token       │ │
│  │ • Metadata       │  │ • Static Config  │  │   Blacklist   │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Airtable Integration

### Purpose
Primary content management system (CMS) backend for storing and tracking content across the platform.

### Configuration

```typescript
// Environment Variables
AIRTABLE_API_KEY=<api-key>
AIRTABLE_BASE_ID=<base-id>
AIRTABLE_TABLE_NAME=<table-name>
```

### Implementation

**Location:** `/lib/data/airtable.ts`

```typescript
// Conceptual structure
interface AirtableClient {
  storeContent(content: ContentType): Promise<string>;
  trackContent(contentId: string, metadata: TrackingData): Promise<void>;
  getContent(contentId: string): Promise<ContentType>;
  listContent(filters?: FilterOptions): Promise<ContentType[]>;
}
```

### Data Models

**Content Record:**
```typescript
interface ContentRecord {
  id: string;
  title: string;
  description: string;
  body: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  platforms: string[];
  createdAt: string;
  updatedAt: string;
  authorId: string;
}
```

**Tracking Record:**
```typescript
interface TrackingRecord {
  contentId: string;
  platform: string;
  publishedAt: string;
  externalId: string;
  engagement: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
}
```

### API Endpoints Using Airtable

| Endpoint | Operation |
|----------|-----------|
| `POST /api/content/store` | Create/update content record |
| `POST /api/content/track` | Add tracking data |
| `GET /api/engagement-metrics` | Retrieve engagement stats |

### Feature Flag Dependency

Airtable integration is controlled by a feature flag:
```typescript
featureFlags.airtableIntegration // boolean
```

---

## JSON File Storage

### Feature Flags

**Location:** `/data/feature-flags.json`

```json
{
  "textParser": {
    "enabled": true,
    "implementation": "openai"
  },
  "imageGeneration": true,
  "summarization": true,
  "platformConnectors": true,
  "multiPlatformPublishing": true,
  "notificationSystem": true,
  "feedbackMechanism": true,
  "airtableIntegration": true
}
```

**Persistence Logic:**

```typescript
// lib/featureFlags.ts
export async function saveFeatureFlags(): Promise<void> {
  await mutex.acquire();
  try {
    if (typeof window !== 'undefined') {
      // Browser: localStorage
      localStorage.setItem('featureFlags', JSON.stringify(featureFlags));
    } else {
      // Node.js: Atomic file write
      const tmpPath = path.join(os.tmpdir(), `feature-flags-${Date.now()}-${crypto.randomUUID()}.json`);
      fs.writeFileSync(tmpPath, JSON.stringify(featureFlags, null, 2), 'utf8');
      fs.renameSync(tmpPath, featureFlagsPath); // Atomic rename
    }
  } finally {
    mutex.release();
  }
}
```

**Thread Safety:**
- Mutex-based synchronization
- Atomic file operations (write to temp, then rename)
- Crypto-based unique temp file names

### Static Configuration

**Location:** `/data/` and `/config/`

| File | Purpose |
|------|---------|
| `platforms.json` | Platform definitions |
| `categories.json` | Content categories |
| Static lookup data | Reference data |

---

## In-Memory Storage

### Rate Limiting Store

**Location:** `/app/api/_utils/rateLimit.ts`

```typescript
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Map structure: "endpoint:ip" -> RateLimitEntry
const rateLimitStore = new Map<string, RateLimitEntry>();

// Automatic cleanup every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60_000);
```

**Limitations:**
- Not shared across multiple instances
- Lost on server restart
- Suitable for single-instance deployment only

### Token Blacklist

**Location:** `/lib/auth/auth-service.ts`

```typescript
// Map structure: token -> expiryTimestamp
const tokenBlacklist = new Map<string, number>();

// Add token to blacklist on logout
addToTokenBlacklist(token: string, expiryTime: number): void {
  tokenBlacklist.set(token, Date.now() + expiryTime * 1000);
  this.cleanupBlacklist();
}

// Automatic cleanup of expired entries
private cleanupBlacklist(): void {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (expiry < now) {
      tokenBlacklist.delete(token);
    }
  }
}
```

---

## Browser Storage

### localStorage Usage

| Key | Purpose | Scope |
|-----|---------|-------|
| `featureFlags` | Feature flag state | Client-side |
| `auth-token` | JWT token (fallback) | Client-side |

### Cookie Storage

| Cookie | Purpose | Attributes |
|--------|---------|------------|
| `auth-token` | JWT authentication | HttpOnly (prod), Secure (prod) |

---

## Data Flow Diagrams

### Content Creation Flow

```
User Input
    │
    ▼
┌─────────────────┐
│  /api/parse     │  ← Parse raw input
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /api/summarize  │  ← AI summarization
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /api/images    │  ← AI image generation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ /api/content/   │  ← Store to Airtable
│    store        │
└────────┬────────┘
         │
         ▼
    AIRTABLE
```

### Feature Flag Flow

```
Admin UI
    │
    ▼
┌─────────────────┐
│ POST /api/      │
│ feature-flags   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ featureFlags.ts │  ← Update in-memory
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ feature-flags   │  ← Persist to file
│    .json        │
└─────────────────┘
```

---

## Type Definitions

### Content Types

```typescript
// types/index.ts
export interface ContentType {
  id?: string;
  title?: string;
  description?: string;
}

export interface QueueItem {
  platform: Platform;
  content: ContentType;
}

export interface PublishResult {
  item: QueueItem;
  error?: string;
}
```

### Platform Types

```typescript
export interface Platform {
  id: number;
  name: string;
}

export interface PlatformConfig {
  apiUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  capabilities?: string[];
  required?: boolean;
}
```

### Feature Flag Types

```typescript
export interface TextParserFeatureFlag {
  enabled: boolean;
  implementation: 'deepseek' | 'openai' | 'azure';
}

export interface FeatureFlags {
  textParser: TextParserFeatureFlag;
  imageGeneration: boolean;
  summarization: boolean;
  platformConnectors: boolean;
  multiPlatformPublishing: boolean;
  notificationSystem: boolean;
  feedbackMechanism: boolean;
  airtableIntegration: boolean;
  [key: string]: boolean | TextParserFeatureFlag | any;
}
```

---

## Data Validation

### Input Validation (Zod)

```typescript
// Server-side validation before storage
const contentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  body: z.string().min(1).max(100000),
  platforms: z.array(z.string()).min(1),
});
```

### Sanitization

```typescript
// Before storing user content
const sanitizedContent = {
  title: sanitizeText(content.title),
  description: sanitizeText(content.description),
  body: sanitizeHtml(content.body, { allowedTags: [...] }),
};
```

---

## Scaling Considerations

### Current Limitations

| Component | Limitation | Impact |
|-----------|------------|--------|
| Rate limiting | In-memory | Single instance only |
| Token blacklist | In-memory | Lost on restart |
| Feature flags | File-based | Single server deployment |
| Airtable | API limits | Rate limited by provider |

### Production Recommendations

| Component | Recommendation |
|-----------|---------------|
| Rate limiting | Redis or Upstash Rate Limit |
| Token blacklist | Redis with TTL |
| Feature flags | Database or LaunchDarkly |
| Content storage | Consider PostgreSQL for scale |
| Caching | Redis for API response caching |

---

## Database Migration Path

### Current State (No Database)

```
App → Airtable (external)
    → JSON files (local)
    → In-memory (runtime)
```

### Recommended Future State

```
App → PostgreSQL (primary database)
    │   └── Users, Content, Audit logs
    ├── Redis (caching/session)
    │   └── Rate limits, Token blacklist, Cache
    └── Airtable (optional, legacy)
```

### Migration Steps

1. **Add PostgreSQL**
   - User management
   - Audit log persistence
   - Content metadata

2. **Add Redis**
   - Session management
   - Rate limiting (multi-instance)
   - Response caching

3. **Migrate from Airtable**
   - Move content to PostgreSQL
   - Keep Airtable as optional sync

---

## Best Practices Compliance

| Practice | Status | Notes |
|----------|--------|-------|
| External data validation | ✅ | Zod schemas |
| Input sanitization | ✅ | DOMPurify |
| Atomic file operations | ✅ | Feature flags |
| Thread safety | ✅ | Mutex for concurrent access |
| Environment-based config | ✅ | Sensitive data in env vars |
| Scalable storage | ❌ | In-memory stores limit scaling |

---

## Recommendations

### Short-term
1. Add database connection (PostgreSQL)
2. Implement user table with proper password hashing
3. Add audit log persistence

### Medium-term
1. Add Redis for rate limiting and caching
2. Migrate token blacklist to Redis
3. Implement database migrations

### Long-term
1. Consider database sharding for scale
2. Implement CQRS if read/write patterns diverge
3. Add data replication for reliability

---

*This document details the data and storage technology stack for the Content Creation Platform.*
