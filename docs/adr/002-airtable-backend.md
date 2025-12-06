# ADR 002: Airtable as Backend Data Store

> **Status**: Accepted
> **Date**: December 2025
> **Decision Makers**: Development Team
> **Technical Area**: Architecture / Data Storage

---

## Context

The Content Creation Platform needs a backend data store for managing:

- Content items and metadata
- Platform configurations
- User preferences
- Workflow states

The application is currently designed as a content creation and management tool that integrates with multiple publishing platforms. Data persistence requirements include:

- CRUD operations on content
- Relational data (content ↔ platforms)
- Simple querying and filtering
- Audit trail for changes

---

## Decision

We will use **Airtable** as the primary backend data store for the Content Creation Platform, accessible via the Airtable API.

### Rationale

1. **No-Code Database Management**: Non-technical team members can view and edit data
2. **Built-in API**: REST API with filtering, sorting, and pagination
3. **Relational Capabilities**: Linked records between tables
4. **Views and Filtering**: Pre-built views for different use cases
5. **Automations**: Built-in workflow automations
6. **Rapid Prototyping**: Quick iteration without schema migrations

---

## Options Considered

### Option 1: Traditional SQL Database (PostgreSQL) ❌

**Pros:**

- Strong consistency
- Complex queries
- Mature ecosystem
- Scalability

**Cons:**

- Requires database administration
- Schema migrations needed
- Higher infrastructure complexity
- No visual interface for non-technical users

### Option 2: NoSQL Database (MongoDB) ❌

**Pros:**

- Flexible schema
- Good for document-based data
- Scalable

**Cons:**

- Still requires administration
- No visual interface
- Query complexity for relational data

### Option 3: Airtable ✅ (Selected)

**Pros:**

- Visual spreadsheet-like interface
- Built-in REST API
- Relational capabilities
- No infrastructure to manage
- Team collaboration features
- Built-in views and filters

**Cons:**

- Rate limits (5 requests/second)
- Record limits (50,000/base on free tier)
- Limited query capabilities
- Vendor lock-in
- Cost scales with usage

### Option 4: Headless CMS (Contentful, Strapi) ❌

**Pros:**

- Content-focused
- API-first
- Media handling

**Cons:**

- Higher cost
- More complex setup
- Overkill for current needs

---

## Implementation

### Schema Design

```
┌─────────────────┐     ┌─────────────────┐
│    Content      │     │   Platforms     │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ title           │     │ name            │
│ body            │     │ type            │
│ status          │     │ config          │
│ created_at      │     │ enabled         │
│ updated_at      │     └─────────────────┘
│ platforms (link)│            ▲
└────────┬────────┘            │
         │                     │
         └─────────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  Publications   │     │  FeatureFlags   │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ content (link)  │     │ name            │
│ platform (link) │     │ enabled         │
│ published_at    │     │ config          │
│ status          │     └─────────────────┘
│ url             │
└─────────────────┘
```

### API Integration

```typescript
// lib/airtable/client.ts
import Airtable from 'airtable';

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

export const tables = {
  content: base('Content'),
  platforms: base('Platforms'),
  publications: base('Publications'),
  featureFlags: base('FeatureFlags'),
};
```

### Rate Limiting Strategy

```typescript
// Handle Airtable's 5 req/sec limit
import { RateLimiter } from '@/lib/rate-limiter';

const airtableRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 1000,
});

export async function airtableRequest<T>(operation: () => Promise<T>): Promise<T> {
  await airtableRateLimiter.acquire();
  return operation();
}
```

### Caching Layer

```typescript
// Reduce API calls with caching
const CACHE_TTL = 60 * 1000; // 1 minute

export async function getContent(id: string) {
  const cacheKey = `content:${id}`;
  const cached = cache.get(cacheKey);

  if (cached) return cached;

  const record = await tables.content.find(id);
  cache.set(cacheKey, record.fields, CACHE_TTL);

  return record.fields;
}
```

---

## Consequences

### Positive

- **Rapid Development**: No database setup or migrations
- **Team Visibility**: Non-technical team can view/edit data
- **Low Ops Overhead**: No database maintenance
- **Built-in Backup**: Airtable handles backups
- **Audit Trail**: Record revision history

### Negative

- **Rate Limits**: 5 requests/second requires careful caching
- **Record Limits**: 50,000 records per base (free tier)
- **Vendor Lock-in**: Migration to SQL would require effort
- **Limited Queries**: No complex joins or aggregations
- **Cost**: Enterprise features are expensive

### Risks and Mitigations

| Risk                  | Likelihood | Impact | Mitigation                               |
| --------------------- | ---------- | ------ | ---------------------------------------- |
| Rate limit hits       | Medium     | Medium | Implement caching, batch operations      |
| Record limit reached  | Low        | High   | Monitor usage, plan migration path       |
| API downtime          | Low        | High   | Implement retry logic, fallback cache    |
| Cost increase         | Medium     | Medium | Monitor usage, evaluate alternatives     |
| Data migration needed | Medium     | High   | Document schema, maintain export scripts |

---

## Migration Path

If Airtable becomes insufficient, the migration path would be:

1. **Export Data**: Use Airtable API to export all records
2. **Transform Schema**: Map Airtable fields to SQL schema
3. **Set Up Database**: PostgreSQL or similar
4. **Update API Layer**: Replace Airtable calls with SQL queries
5. **Parallel Run**: Run both systems, validate data consistency
6. **Cutover**: Switch to new database

### Migration Triggers

Consider migration when:

- Approaching 50,000 records in any table
- Rate limits causing user-facing issues
- Complex queries needed (aggregations, joins)
- Cost exceeds SQL hosting + maintenance

---

## Feature Flag Integration

The `airtableIntegration` feature flag controls this backend:

```typescript
// lib/featureFlags.ts
export const featureFlags = {
  airtableIntegration: true, // Enable/disable Airtable backend
};
```

This allows switching to an alternative backend without code changes.

---

## Related Documents

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- `lib/featureFlags.ts` - Feature flag configuration
- `docs/analysis/scores/07-ERROR_HANDLING.md` - Error handling patterns

---

## Changelog

| Date    | Author           | Change             |
| ------- | ---------------- | ------------------ |
| 2025-12 | Development Team | Initial acceptance |
