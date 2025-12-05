# External Integrations Technology Stack

> **Layer**: External Integrations
> **Technologies**: Hugging Face AI, Slack, Twilio, Nodemailer
> **Last Updated**: December 2025

---

## Overview

The Content Creation Platform integrates with multiple external services for AI capabilities, content storage, and multi-channel notifications. These integrations are managed through dedicated client modules with feature flag controls.

---

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                     AI SERVICES                          │    │
│  │  ┌─────────────┐                                        │    │
│  │  │ Hugging Face│  Image generation, Text processing     │    │
│  │  └─────────────┘                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   CONTENT STORAGE                        │    │
│  │  ┌─────────────┐                                        │    │
│  │  │  Airtable   │  Content CMS, Tracking, Metadata       │    │
│  │  └─────────────┘                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  NOTIFICATIONS                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │    │
│  │  │    Slack    │  │   Twilio    │  │  Nodemailer │     │    │
│  │  │   (Teams)   │  │   (SMS)     │  │   (Email)   │     │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │               SOCIAL MEDIA PLATFORMS                     │    │
│  │  ┌────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐         │    │
│  │  │Facebook│ │Instagram│ │LinkedIn│ │ Twitter │         │    │
│  │  └────────┘ └─────────┘ └────────┘ └─────────┘         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Services

### Hugging Face

| Aspect | Details |
|--------|---------|
| **Purpose** | AI image generation |
| **API** | Inference API |
| **Model** | Stable Diffusion |
| **Rate Limit** | 10 requests/minute |

**Configuration:**
```bash
HUGGING_FACE_API_KEY=<your-api-key>
```

**Client Implementation:**

**Location:** `/lib/clients/huggingface.ts`

```typescript
export class HuggingFaceClient {
  private apiKey: string;
  private baseUrl = 'https://api-inference.huggingface.co/models';
  private model = 'stabilityai/stable-diffusion-2-1';

  async generateImage(context: string): Promise<ImageResult> {
    const response = await fetch(`${this.baseUrl}/${this.model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: context }),
    });

    // Process and return image
    return {
      id: generateId(),
      url: await processImageResponse(response),
    };
  }

  async approveImage(image: ImageResult): Promise<void> {
    console.log('Image approved:', image);
    // Mark as approved in system
  }

  async rejectImage(image: ImageResult): Promise<void> {
    console.log('Image rejected:', image);
    // Mark as rejected in system
  }

  async regenerateImage(context: string): Promise<ImageResult> {
    return this.generateImage(context);
  }
}
```

**Feature Flag:**
```typescript
featureFlags.imageGeneration // boolean
```

**API Endpoint:**
- `POST /api/images` - Generate image
- `PUT /api/images` - Approve/reject/regenerate

### Text Processing (Configurable)

| Provider | Status | Feature Flag |
|----------|--------|--------------|
| OpenAI | Available | `textParser.implementation: 'openai'` |
| DeepSeek | Available | `textParser.implementation: 'deepseek'` |
| Azure OpenAI | Available | `textParser.implementation: 'azure'` |

**Feature Flag Configuration:**
```typescript
featureFlags.textParser = {
  enabled: true,
  implementation: 'openai' | 'deepseek' | 'azure'
};
```

---

## Content Storage

### Airtable

| Aspect | Details |
|--------|---------|
| **Purpose** | Content CMS backend |
| **Operations** | CRUD for content records |
| **Tracking** | Publishing history, engagement |

**Configuration:**
```bash
AIRTABLE_API_KEY=<your-api-key>
AIRTABLE_BASE_ID=<your-base-id>
AIRTABLE_TABLE_NAME=<your-table-name>
```

**Client Implementation:**

**Location:** `/lib/data/airtable.ts`

```typescript
interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tableName: string;
}

export class AirtableClient {
  async storeContent(content: ContentType): Promise<string>;
  async trackContent(contentId: string, tracking: TrackingData): Promise<void>;
  async getContent(contentId: string): Promise<ContentType>;
  async listContent(filters?: FilterOptions): Promise<ContentType[]>;
}
```

**Feature Flag:**
```typescript
featureFlags.airtableIntegration // boolean
```

**API Endpoints:**
- `POST /api/content/store` - Store content
- `POST /api/content/track` - Track published content
- `GET /api/engagement-metrics` - Get metrics

---

## Notification Services

### Slack

| Aspect | Details |
|--------|---------|
| **Package** | `@slack/web-api` (^7.9.1) |
| **Purpose** | Team notifications |
| **Method** | Bot token API |

**Configuration:**
```bash
SLACK_TOKEN=<your-bot-token>
```

**Usage:**
```typescript
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_TOKEN);

await slack.chat.postMessage({
  channel: '#notifications',
  text: 'Content published successfully!',
});
```

### Twilio (SMS)

| Aspect | Details |
|--------|---------|
| **Package** | `twilio` (^5.5.2) |
| **Purpose** | SMS notifications |
| **Method** | REST API |

**Configuration:**
```bash
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=<your-phone-number>
```

**Usage:**
```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

await client.messages.create({
  body: 'Your content has been published!',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: recipientPhone,
});
```

### Nodemailer (Email)

| Aspect | Details |
|--------|---------|
| **Package** | `nodemailer` (^7.0.7) |
| **Purpose** | Email notifications |
| **Provider** | Gmail (OAuth2) |

**Configuration:**
```bash
EMAIL_USER=<your-email>
GMAIL_CLIENT_ID=<client-id>
GMAIL_CLIENT_SECRET=<client-secret>
GMAIL_REFRESH_TOKEN=<refresh-token>
```

**Usage:**
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  },
});

await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: recipientEmail,
  subject: 'Content Published',
  text: 'Your content has been published successfully!',
});
```

### Unified Notification API

**Endpoint:** `POST /api/notifications`

**Request:**
```typescript
interface NotificationRequest {
  message: string;
  type: 'email' | 'slack' | 'sms';
  recipient: string;
}
```

**Feature Flag:**
```typescript
featureFlags.notificationSystem // boolean
```

---

## Social Media Platforms

### Platform Configuration

**Location:** `/lib/config/platforms.ts`

```typescript
interface PlatformConfig {
  apiUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  capabilities?: string[];
  required?: boolean;
}

const platformConfigs: Record<string, PlatformConfig> = {
  facebook: {
    apiUrl: process.env.FACEBOOK_API_URL || 'https://graph.facebook.com',
    apiKey: process.env.FACEBOOK_API_KEY,
    capabilities: ['posts', 'images', 'videos', 'stories'],
  },
  instagram: {
    apiUrl: process.env.INSTAGRAM_API_URL || 'https://graph.instagram.com',
    apiKey: process.env.INSTAGRAM_API_KEY,
    capabilities: ['posts', 'images', 'stories', 'reels'],
  },
  linkedin: {
    apiUrl: process.env.LINKEDIN_API_URL || 'https://api.linkedin.com',
    apiKey: process.env.LINKEDIN_API_KEY,
    capabilities: ['posts', 'articles', 'images'],
  },
  twitter: {
    apiUrl: process.env.TWITTER_API_URL || 'https://api.twitter.com',
    apiKey: process.env.TWITTER_API_KEY,
    capabilities: ['tweets', 'images', 'threads'],
  },
};
```

### Configuration Variables

```bash
# Facebook
FACEBOOK_API_URL=https://graph.facebook.com
FACEBOOK_API_KEY=<your-api-key>

# Instagram
INSTAGRAM_API_URL=https://graph.instagram.com
INSTAGRAM_API_KEY=<your-api-key>

# LinkedIn
LINKEDIN_API_URL=https://api.linkedin.com
LINKEDIN_API_KEY=<your-api-key>

# Twitter/X
TWITTER_API_URL=https://api.twitter.com
TWITTER_API_KEY=<your-api-key>
```

### API Endpoints

- `GET /api/platforms` - List all platforms
- `GET /api/platforms/[id]/capabilities` - Get platform capabilities

**Feature Flags:**
```typescript
featureFlags.platformConnectors // boolean
featureFlags.multiPlatformPublishing // boolean
```

---

## Feature Flag Control

### Integration Feature Flags

| Flag | Controls |
|------|----------|
| `imageGeneration` | Hugging Face image API |
| `textParser` | Text processing (with implementation) |
| `airtableIntegration` | Airtable storage |
| `notificationSystem` | All notification channels |
| `platformConnectors` | Social platform APIs |
| `multiPlatformPublishing` | Multi-platform posting |

### Runtime Checking

```typescript
// In API routes
import featureFlags from '@/lib/featureFlags';

if (!featureFlags.imageGeneration) {
  return Errors.forbidden('Image generation is disabled');
}
```

---

## Error Handling

### Integration Errors

```typescript
try {
  const result = await externalService.operation();
} catch (error) {
  // Log for debugging
  console.error('Integration error:', {
    service: 'serviceName',
    operation: 'operationName',
    error: error.message,
  });

  // Audit log
  auditLog('INTEGRATION_ERROR', userId, {
    service: 'serviceName',
    error: error.message,
  });

  // Return user-friendly error
  return Errors.internalServerError('Service temporarily unavailable');
}
```

### Retry Strategy

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoff: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(backoff * attempt);
    }
  }
}
```

---

## Rate Limiting

### External Service Limits

| Service | Limit | Implementation |
|---------|-------|----------------|
| Hugging Face | API-dependent | 10 req/min preset |
| Airtable | 5 req/sec | Queuing |
| Slack | Varies | Token bucket |
| Twilio | Account-based | Per-account |
| Gmail | 500/day free | Batch recommended |

### Internal Rate Limiting

```typescript
// AI services get stricter limits
export const POST = withRateLimit(
  handler,
  '/api/images',
  RateLimitPresets.AI_SERVICE // 10 req/min
);
```

---

## Monitoring & Logging

### Current State

```typescript
// Console logging for integrations
console.log('[AUDIT]', JSON.stringify({
  action: 'GENERATE_IMAGE',
  user: userId,
  timestamp: new Date().toISOString(),
  body: { contextLength: context.length },
}));
```

### Recommended Additions

- [ ] External service health checks
- [ ] Response time tracking
- [ ] Error rate monitoring
- [ ] Cost tracking (AI services)

---

## Security Considerations

### API Key Storage

| Current | Recommended |
|---------|-------------|
| Environment variables | Azure Key Vault |
| GitHub Secrets (CI) | Managed identities |

### Data in Transit

- All external APIs use HTTPS
- TLS 1.2+ required
- API keys in headers (not URLs)

### Data Handling

- Sanitize content before sending
- Don't log sensitive responses
- Redact API keys in logs

---

## Dependency Versions

| Package | Version | Purpose |
|---------|---------|---------|
| `@slack/web-api` | ^7.9.1 | Slack integration |
| `twilio` | ^5.5.2 | SMS notifications |
| `nodemailer` | ^7.0.7 | Email notifications |
| `axios` | ^1.9.0 | HTTP client |

---

## Best Practices Compliance

| Practice | Status | Notes |
|----------|--------|-------|
| Feature flag control | ✅ | All integrations flagged |
| Error handling | ✅ | Try-catch with logging |
| Rate limiting | ✅ | AI_SERVICE preset |
| Secrets in env vars | ✅ | All API keys |
| Retry logic | ⚠️ | Basic implementation |
| Health checks | ❌ | Not implemented |
| Cost monitoring | ❌ | Not implemented |

---

## Recommendations

### Short-term
1. Add health check endpoints for external services
2. Implement proper retry with exponential backoff
3. Add response time logging

### Medium-term
1. Move secrets to Azure Key Vault
2. Add cost tracking for AI services
3. Implement circuit breaker pattern

### Long-term
1. Add service mesh for external calls
2. Implement comprehensive monitoring
3. Consider caching layer for repeated requests

---

*This document details the external integrations for the Content Creation Platform.*
