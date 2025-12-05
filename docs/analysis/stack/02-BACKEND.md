# Backend Technology Stack

> **Layer**: Backend
> **Technologies**: Next.js App Router + Pages Router, Express middleware patterns
> **Last Updated**: December 2025

---

## Overview

The backend is built entirely within the Next.js framework, utilizing both the modern App Router for API routes and legacy Pages Router patterns. Express-style middleware patterns are adopted for cross-cutting concerns like rate limiting.

---

## Core Technologies

### Next.js API Routes

| Router | Location | Status |
|--------|----------|--------|
| **App Router** | `/app/api/*/route.ts` | Primary (active) |
| **Pages Router** | `/pages/api/*.ts` | Legacy (migration pending) |

### Runtime
- **Node.js 20 LTS** (Azure deployment target)
- **Edge Runtime**: Not currently used

---

## API Architecture

### Route Handler Pattern (App Router)

```typescript
// app/api/[endpoint]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RateLimitPresets } from '../_utils/rateLimit';
import { withErrorHandling, Errors } from '../_utils/errors';
import { validateAndSanitize, schema } from '../_utils/sanitize';
import { auditLog } from '../_utils/audit';

export const POST = withRateLimit(
  withErrorHandling(async (request: NextRequest) => {
    // 1. Authentication (via middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return Errors.unauthorized();
    }

    // 2. Input validation & sanitization
    const body = await request.json();
    const validation = validateAndSanitize(schema, body);
    if (!validation.success) {
      return Errors.badRequest('Validation failed', validation.errors);
    }

    // 3. Business logic
    const result = await processRequest(validation.data);

    // 4. Audit logging
    auditLog('ACTION_NAME', userId, { context: 'data' });

    // 5. Response
    return NextResponse.json({ success: true, data: result });
  }),
  '/api/endpoint',
  RateLimitPresets.GENERAL
);
```

### Request Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────────────────────────┐
│           Next.js Middleware            │
│  ┌─────────────────────────────────┐   │
│  │  JWT Validation                  │   │
│  │  - Check auth-token cookie       │   │
│  │  - Check Authorization header    │   │
│  │  - Verify token signature        │   │
│  │  - Check expiration              │   │
│  │  - Inject user headers           │   │
│  └─────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│           Rate Limiter                  │
│  - Check request count per IP/endpoint  │
│  - Return 429 if exceeded              │
│  - Add rate limit headers              │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│           Error Handler                 │
│  - Wrap in try-catch                   │
│  - Standardize error responses         │
│  - Log errors with context             │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│           Route Handler                 │
│  1. Validate & sanitize input          │
│  2. Execute business logic             │
│  3. Audit log action                   │
│  4. Return response                    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

---

## API Endpoints

### App Router Endpoints (Primary)

| Endpoint | Methods | Purpose | Auth Required |
|----------|---------|---------|---------------|
| `/api/auth` | POST, DELETE | Login/logout | No (login), Yes (logout) |
| `/api/audit` | GET | Retrieve audit logs | Admin |
| `/api/content/store` | POST | Store content to Airtable | Yes |
| `/api/content/track` | POST | Track published content | Yes |
| `/api/engagement-metrics` | GET | Get engagement metrics | Yes |
| `/api/feature-flags` | GET, POST | Manage feature flags | Admin |
| `/api/feedback` | POST | Submit user feedback | Yes |
| `/api/images` | POST, PUT | Generate/review images | Yes |
| `/api/notifications` | POST | Send notifications | Yes |
| `/api/parse` | POST | Parse text content | Yes |
| `/api/platforms` | GET | List platforms | Yes |
| `/api/platforms/[id]/capabilities` | GET | Platform capabilities | Yes |
| `/api/queue/approve` | POST | Approve content queue | Yes |
| `/api/summarize` | POST | Summarize text | Yes |

### Rate Limit Configuration

| Preset | Requests | Window | Use Case |
|--------|----------|--------|----------|
| AUTH | 5 | 15 min | Login attempts |
| AI_SERVICE | 10 | 1 min | Image/text generation |
| GENERAL | 100 | 15 min | Standard endpoints |
| ADMIN | 50 | 1 hour | Admin operations |

---

## Shared Utilities

### Location: `/app/api/_utils/`

| Utility | File | Purpose |
|---------|------|---------|
| **Audit Logging** | `audit.ts` | Action logging with user context |
| **Authentication** | `auth.ts` | Auth helpers for route handlers |
| **Error Handling** | `errors.ts` | Standardized error responses |
| **Rate Limiting** | `rateLimit.ts` | Request throttling |
| **RBAC** | `rbac.ts` | Role-based access control |
| **Sanitization** | `sanitize.ts` | Input sanitization with Zod |
| **Validation** | `validation.ts` | Input validation schemas |

### Error Response Structure

```typescript
interface ErrorResponse {
  message: string;      // Human-readable message
  code?: string;        // Machine-readable code
  details?: any;        // Additional context
}

// Standard error codes
const Errors = {
  badRequest: (msg, details) => createErrorResponse(msg, 400, details, 'BAD_REQUEST'),
  unauthorized: (msg) => createErrorResponse(msg, 401, null, 'UNAUTHORIZED'),
  forbidden: (msg) => createErrorResponse(msg, 403, null, 'FORBIDDEN'),
  notFound: (msg) => createErrorResponse(msg, 404, null, 'NOT_FOUND'),
  internalServerError: (msg) => createErrorResponse(msg, 500, null, 'INTERNAL_SERVER_ERROR'),
};
```

---

## Authentication System

### JWT Implementation

```typescript
// middleware.ts
import jwt from 'jsonwebtoken';

// Fail fast if JWT_SECRET missing
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

export function middleware(request: NextRequest) {
  // Get token from cookie or header
  let token = request.cookies.get('auth-token')?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    token = authHeader?.replace('Bearer ', '');
  }

  // Verify token
  const decoded = jwt.verify(token, JWT_SECRET);

  // Inject user info into request headers
  requestHeaders.set('x-user-id', decoded.id);
  requestHeaders.set('x-user-role', decoded.role);
  requestHeaders.set('x-user-name', decoded.username);
}
```

### Auth Service

```typescript
// lib/auth/auth-service.ts
export class AuthService {
  generateToken(user: User, expiresIn = '1h'): string;
  verifyToken(token: string): TokenPayload | null;
  getCurrentUser(): User | null;
  isTokenBlacklisted(token: string): boolean;
  addToTokenBlacklist(token: string, expiryTime: number): void;
}
```

### Protected Routes

| Route Pattern | Auth Level |
|---------------|------------|
| `/api/platforms/*` | Authenticated |
| `/api/queue/*` | Authenticated |
| `/api/images/*` | Authenticated |
| `/api/parse` | Authenticated |
| `/api/summarize` | Authenticated |
| `/api/content/*` | Authenticated |
| `/api/feedback` | Authenticated |
| `/api/notifications` | Authenticated |
| `/api/feature-flags` | Admin |
| `/api/audit` | Admin |

---

## Input Validation & Sanitization

### Zod Schemas

```typescript
// app/api/_utils/sanitize.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export const textInputSchema = z.object({
  rawInput: z
    .string()
    .min(1, 'Input cannot be empty')
    .max(1_000_000, 'Input too large')
    .transform(val => sanitizeText(val)),
});

export const imageContextSchema = z.object({
  context: z
    .string()
    .min(1, 'Context cannot be empty')
    .max(10_000, 'Context too large')
    .transform(val => sanitizeText(val)),
});
```

### Sanitization Functions

```typescript
// HTML sanitization
function sanitizeHtml(input: string, options?: { allowedTags, allowedAttributes }): string;

// Plain text (strip all HTML)
function sanitizeText(input: string): string;

// URL sanitization (SSRF prevention)
function sanitizeUrl(url: string, allowedDomains?: string[]): string | null;

// JSON validation
function validateJson(input: string): object | null;
```

---

## Business Logic Layer

### Service Classes

| Service | Location | Purpose |
|---------|----------|---------|
| `AuthService` | `/lib/auth/auth-service.ts` | Authentication operations |
| `HuggingFaceClient` | `/lib/clients/huggingface.ts` | AI image generation |

### Data Access

| Module | Location | Purpose |
|--------|----------|---------|
| `airtable.ts` | `/lib/data/airtable.ts` | Airtable integration |
| `featureFlags.ts` | `/lib/featureFlags.ts` | Feature flag management |

---

## Feature Flags System

### Implementation

```typescript
// lib/featureFlags.ts
interface FeatureFlags {
  textParser: { enabled: boolean; implementation: 'deepseek' | 'openai' | 'azure' };
  imageGeneration: boolean;
  summarization: boolean;
  platformConnectors: boolean;
  multiPlatformPublishing: boolean;
  notificationSystem: boolean;
  feedbackMechanism: boolean;
  airtableIntegration: boolean;
}

// Persistence
// - Browser: localStorage
// - Node.js: JSON file (data/feature-flags.json)

// Thread safety
// - Mutex for concurrent updates
// - Atomic file operations
```

---

## Express Middleware Patterns

### Rate Limiting

```typescript
// app/api/_utils/rateLimit.ts
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
}

// In-memory store
const rateLimitStore = new Map<string, RateLimitEntry>();

// Wrapper function
export function withRateLimit<T>(
  handler: T,
  endpoint: string,
  config: RateLimitConfig
): T;
```

### Error Handling

```typescript
// app/api/_utils/errors.ts
export function withErrorHandling(
  handler: (req: Request, context?: any) => Promise<Response>
): (req: Request, context?: any) => Promise<Response> {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error('API Error:', { error, timestamp, url, method });
      return Errors.internalServerError(error.message);
    }
  };
}
```

---

## Audit Logging

### Log Format

```typescript
interface AuditLogEntry {
  action: string;        // Action type (e.g., 'LOGIN_SUCCESS')
  user: string;          // User ID
  timestamp: string;     // ISO 8601
  path: string;          // Request path
  method: string;        // HTTP method
  body?: object;         // Sanitized request body
}
```

### Action Types

| Category | Actions |
|----------|---------|
| Auth | LOGIN_ATTEMPT, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT |
| Data | GET_PLATFORMS_LIST, GET_FEATURE_FLAGS, GET_PLATFORM_CAPABILITIES |
| Mutations | UPDATE_FEATURE_FLAG, GENERATE_IMAGE, REVIEW_IMAGE |

---

## Environment Configuration

### Required Variables

```bash
JWT_SECRET=<secure-random-string>  # Required at startup
```

### Optional Variables

```bash
# Airtable
AIRTABLE_API_KEY=<key>
AIRTABLE_BASE_ID=<id>
AIRTABLE_TABLE_NAME=<name>

# AI Services
HUGGING_FACE_API_KEY=<key>

# Notifications
SLACK_TOKEN=<token>
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
EMAIL_USER=<email>
GMAIL_CLIENT_ID=<id>
GMAIL_CLIENT_SECRET=<secret>
```

---

## Legacy API Routes (Pages Router)

### Migration Status

| Endpoint | Status |
|----------|--------|
| Auth | Migrated to App Router |
| Feature Flags | Migrated to App Router |
| Images | Migrated to App Router |
| Parse | Migrated to App Router |
| Platforms | Migrated to App Router |
| Queue | Migrated to App Router |
| Others | Pending migration |

### Migration Path

1. Create new route in `/app/api/`
2. Apply security patterns (rate limit, validation, sanitization)
3. Add audit logging
4. Test thoroughly
5. Update client code
6. Remove legacy route

---

## Best Practices Compliance

| Practice | Status | Notes |
|----------|--------|-------|
| App Router for API | ✅ | Primary pattern |
| Input validation | ✅ | Zod schemas |
| Input sanitization | ✅ | DOMPurify |
| Rate limiting | ✅ | All endpoints |
| Error handling | ✅ | Standardized responses |
| Audit logging | ✅ | All actions logged |
| JWT authentication | ✅ | With blacklist |
| RBAC | ✅ | Admin/user roles |

---

## Recommendations

### Short-term
1. Complete Pages Router API migration
2. Add request ID correlation for tracing
3. Implement health check endpoint

### Medium-term
1. Replace in-memory rate limiting with Redis
2. Add structured logging service
3. Implement database for user storage

### Long-term
1. Consider API versioning strategy
2. Add OpenAPI/Swagger documentation
3. Implement API gateway pattern

---

*This document details the backend technology stack for the Content Creation Platform.*
