# Architecture Overview — OmniPost

> **Document Status:** Phase 2 Discovery Output
> **Architecture Style:** Layered monolith with API-first design

---

## Executive Summary

OmniPost follows a **layered monolithic architecture** with clear separation between presentation, application, domain, and infrastructure layers. The system is designed for AI-powered content creation and multi-platform publishing with human-in-the-loop review workflows.

| Characteristic     | Description                           |
| ------------------ | ------------------------------------- |
| Architecture Style | Layered Monolith                      |
| API Design         | REST with route handlers              |
| Rendering Strategy | Hybrid (SSR/SSG via Next.js)          |
| State Pattern      | Server-first with client hydration    |
| Security Model     | JWT + RBAC + Rate Limiting            |
| Deployment Pattern | Single-instance PaaS (Azure Web Apps) |

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Pages Router   │  │   Components    │  │  Custom Hooks   │  │
│  │   (Legacy)      │  │    (React)      │  │ (Business Logic)│  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Middleware Stack                          ││
│  │  [Rate Limit] → [JWT Auth] → [RBAC] → [Validation] → [Audit]││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Route Handlers                            ││
│  │  /auth  /content  /images  /parse  /summarize  /platforms   ││
│  │  /queue  /feedback  /notifications  /feature-flags  /audit  ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Shared Utilities                          ││
│  │  [Errors] [Validation] [Sanitization] [Rate Limiting]       ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                        DOMAIN LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Content    │  │   Platform   │  │      Workflow          │ │
│  │   Services   │  │   Services   │  │      Services          │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │     Auth     │  │   Feature    │  │       Audit            │ │
│  │   Services   │  │    Flags     │  │      Services          │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Airtable   │  │ Hugging Face │  │  Notification Services │ │
│  │   (Storage)  │  │   (AI/ML)    │  │  (Slack/Twilio/Email)  │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Social Media Platform APIs                      ││
│  │         (Facebook, Instagram, LinkedIn, Twitter)             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────┐
│                   DEPLOYMENT INFRASTRUCTURE                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Azure Web    │  │   GitHub     │  │      Bicep IaC         │ │
│  │    Apps      │  │   Actions    │  │    (Infrastructure)    │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Descriptions

### Presentation Layer

| Component        | Purpose                           | Location       |
| ---------------- | --------------------------------- | -------------- |
| Pages Router     | Legacy page-based routing         | `/pages/`      |
| React Components | UI rendering and user interaction | `/components/` |
| Custom Hooks     | Encapsulated business logic       | `/hooks/`      |
| CSS Modules      | Component-scoped styling          | `*.module.css` |
| Global Styles    | Application-wide styling          | `/styles/`     |

### Application Layer

| Component        | Purpose                             | Location           |
| ---------------- | ----------------------------------- | ------------------ |
| Route Handlers   | API endpoint implementations        | `/app/api/`        |
| Middleware       | Cross-cutting concerns (auth, etc.) | `/middleware.ts`   |
| Shared Utilities | Common API utilities                | `/app/api/_utils/` |
| Validation       | Request validation schemas          | `/app/api/_utils/` |

### Domain Layer

| Service Type      | Responsibility                    | Pattern              |
| ----------------- | --------------------------------- | -------------------- |
| Content Services  | Content CRUD and adaptation       | Service Layer        |
| Platform Services | Platform-specific transformations | Strategy Pattern     |
| Workflow Services | Review and approval workflows     | State Machine        |
| Auth Services     | Authentication and authorization  | Middleware Chain     |
| Feature Flags     | Feature toggle management         | Feature Flag Pattern |

### Infrastructure Layer

| Integration      | Purpose                     | Communication     |
| ---------------- | --------------------------- | ----------------- |
| Airtable         | Primary content storage     | REST API          |
| Hugging Face     | AI image generation         | REST API          |
| OpenAI/DeepSeek  | Text processing             | REST API          |
| Social Platforms | Content publishing          | Platform-specific |
| Notification     | Multi-channel notifications | Service-specific  |

---

## Directory Structure

```
content_creation/
├── app/                      # Next.js App Router
│   └── api/                  # API route handlers
│       ├── _utils/           # Shared utilities
│       │   ├── audit.ts      # Audit logging
│       │   ├── auth.ts       # Authentication helpers
│       │   ├── errors.ts     # Error handling
│       │   ├── rateLimit.ts  # Rate limiting
│       │   ├── rbac.ts       # Role-based access control
│       │   ├── sanitize.ts   # Input sanitization
│       │   └── validation.ts # Input validation
│       ├── audit/            # Audit trail API
│       ├── auth/             # Authentication API
│       ├── content/          # Content management API
│       ├── feature-flags/    # Feature flags API
│       ├── feedback/         # User feedback API
│       ├── images/           # Image generation API
│       ├── notifications/    # Notifications API
│       ├── parse/            # Text parsing API
│       ├── platforms/        # Platform integration API
│       ├── queue/            # Content queue API
│       └── summarize/        # Text summarization API
│
├── pages/                    # Next.js Pages Router (legacy)
│   ├── api/                  # Legacy API routes
│   └── *.tsx                 # Page components
│
├── components/               # React components
│   ├── adaptation/           # Content adaptation
│   ├── automation/           # Automation tools
│   ├── content/              # Content management
│   ├── dashboard/            # Analytics dashboard
│   ├── feature-flags/        # Feature flag UI
│   ├── feedback/             # Feedback forms
│   ├── image/                # Image generation UI
│   ├── layouts/              # Layout components
│   ├── platform/             # Platform connectors
│   ├── review/               # Review workflow
│   ├── series/               # Series management
│   ├── text/                 # Text processing UI
│   └── ui/                   # Shared UI components
│
├── lib/                      # Core libraries
│   ├── auth/                 # Authentication logic
│   ├── clients/              # External API clients
│   ├── config/               # Configuration
│   ├── data/                 # Data access layer
│   └── storage/              # Storage utilities
│
├── hooks/                    # Custom React hooks
├── types/                    # TypeScript definitions
├── styles/                   # CSS files
├── __tests__/                # Test files
├── docs/                     # Documentation
├── infra/                    # Bicep templates
└── scripts/                  # Build scripts
```

---

## API Architecture

### Request Flow

```
Request
   │
   ▼
┌──────────────────┐
│   Rate Limiter   │ ─── Exceeds limit? → 429 Too Many Requests
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Authentication  │ ─── Invalid token? → 401 Unauthorized
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Authorization   │ ─── No permission? → 403 Forbidden
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Validation     │ ─── Invalid input? → 400 Bad Request
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Sanitization    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Route Handler   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Audit Log      │
└────────┬─────────┘
         │
         ▼
Response
```

### Route Handler Pattern

```typescript
export const POST = withRateLimit(
  withErrorHandling(async (request: Request) => {
    // 1. Authentication
    if (!(await isAuthenticated())) {
      return Errors.unauthorized();
    }

    // 2. Validation & Sanitization
    const body = await request.json();
    const validation = validateAndSanitize(schema, body);
    if (!validation.success) {
      return Errors.badRequest(validation.errors);
    }

    // 3. Authorization
    const user = await getCurrentUser();
    if (!hasPermission(user, 'required-permission')) {
      return Errors.forbidden();
    }

    // 4. Business Logic
    const result = await performOperation(validation.data);

    // 5. Audit
    await auditLog('OPERATION', user.id, { context });

    // 6. Response
    return Response.json({ success: true, data: result });
  }),
  '/api/route-path',
  RateLimitPresets.GENERAL
);
```

### Rate Limiting Strategy

| Endpoint Type | Limit        | Window | Rationale             |
| ------------- | ------------ | ------ | --------------------- |
| AUTH          | 5 requests   | 15 min | Prevent brute force   |
| AI_SERVICE    | 10 requests  | 1 min  | Cost management       |
| GENERAL       | 100 requests | 15 min | Standard protection   |
| ADMIN         | 50 requests  | 15 min | Balanced admin access |

---

## Security Architecture

### Authentication Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │ POST /api/auth (credentials)
     ▼
┌─────────────────┐
│  Auth Handler   │
│  - Validate     │
│  - bcrypt verify│
│  - Generate JWT │
└────┬────────────┘
     │ { token, user }
     ▼
┌─────────┐
│ Client  │
│ (Store) │
└────┬────┘
     │ Subsequent requests
     │ Authorization: Bearer <token>
     ▼
┌─────────────────┐
│   Middleware    │
│  - Verify JWT   │
│  - Check expiry │
│  - Attach user  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Route Handler  │
│  - Check RBAC   │
│  - Process      │
└─────────────────┘
```

### Security Layers

| Layer              | Implementation                   | Purpose          |
| ------------------ | -------------------------------- | ---------------- |
| Transport          | HTTPS (forced via HSTS)          | Encryption       |
| Rate Limiting      | In-memory with Upstash option    | DoS protection   |
| Authentication     | JWT with configurable expiry     | Identity         |
| Authorization      | RBAC with role-based permissions | Access control   |
| Input Validation   | Zod schemas                      | Type safety      |
| Input Sanitization | DOMPurify                        | XSS prevention   |
| Security Headers   | CSP, X-Frame-Options, etc.       | Browser security |
| Audit Logging      | Console with redaction           | Compliance       |

### Security Headers Applied

| Header                    | Value                                        |
| ------------------------- | -------------------------------------------- |
| Strict-Transport-Security | max-age=63072000; includeSubDomains; preload |
| X-Frame-Options           | DENY                                         |
| X-Content-Type-Options    | nosniff                                      |
| Content-Security-Policy   | Restrictive policy                           |
| Referrer-Policy           | strict-origin-when-cross-origin              |
| Permissions-Policy        | Restrictive permissions                      |

---

## Data Flow Patterns

### Content Creation Flow

```
User Input
    │
    ▼
┌──────────────────┐
│  Draft Creation  │ ──→ Airtable (draft status)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   AI Processing  │
│  - Summarization │ ──→ Hugging Face / OpenAI
│  - Image Gen     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Platform Adapt   │ ──→ Per-platform formatting
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Review Queue    │ ──→ Human approval
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Publishing     │ ──→ Platform APIs
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Analytics      │ ──→ Engagement tracking
└──────────────────┘
```

### Feature Flag Flow

```
┌──────────────────┐
│  Feature Check   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│ Server Context?  │───Yes──▶│   JSON File      │
└────────┬─────────┘         │  (data/flags)    │
         │                   └──────────────────┘
         No
         │
         ▼
┌──────────────────┐
│   localStorage   │
└──────────────────┘
```

---

## Component Architecture

### Component Organization

| Category | Location                 | Purpose             |
| -------- | ------------------------ | ------------------- |
| UI       | `/components/ui/`        | Reusable primitives |
| Feature  | `/components/[feature]/` | Feature-specific    |
| Layout   | `/components/layouts/`   | Page structure      |

### Component Patterns

| Pattern        | Usage                         | Example                 |
| -------------- | ----------------------------- | ----------------------- |
| Container/View | Logic/presentation separation | Dashboard components    |
| Compound       | Related components together   | Form components         |
| Render Props   | Flexible rendering            | Data fetching           |
| Custom Hooks   | Shared logic extraction       | useAuth, useFeatureFlag |

---

## Integration Patterns

### External API Integration

| Service       | Pattern             | Error Handling         |
| ------------- | ------------------- | ---------------------- |
| Airtable      | Repository + Client | Retry with backoff     |
| Hugging Face  | Service wrapper     | Graceful degradation   |
| Social APIs   | Adapter pattern     | Per-platform handling  |
| Notifications | Strategy pattern    | Multi-channel fallback |

### API Client Pattern

```typescript
// lib/clients/airtable.ts
class AirtableClient {
  private base: Airtable.Base;

  async findRecords(table: string, query: Query): Promise<Record[]> {
    // Validation, execution, error handling
  }

  async createRecord(table: string, data: RecordData): Promise<Record> {
    // Sanitization, creation, audit
  }
}
```

---

## Scalability Considerations

### Current Constraints

| Constraint             | Impact                  | Mitigation Path         |
| ---------------------- | ----------------------- | ----------------------- |
| In-memory rate limits  | Single-instance only    | Upstash Redis available |
| Airtable as primary DB | 100k records per base   | Database migration      |
| Single Azure instance  | No horizontal scaling   | Add load balancer       |
| No caching layer       | Repeated external calls | Add Redis/SWR           |

### Scaling Recommendations

| Requirement          | Solution                     | Effort |
| -------------------- | ---------------------------- | ------ |
| Multi-instance       | Enable Upstash rate limiting | Low    |
| Persistent sessions  | External session store       | Medium |
| Database scalability | Migrate from Airtable        | High   |
| Static asset CDN     | Azure CDN integration        | Low    |

---

## Quality Characteristics

### Achieved

| Quality         | Evidence                               |
| --------------- | -------------------------------------- |
| Security        | OWASP-aligned, JWT+RBAC, sanitization  |
| Maintainability | Feature-based organization, TypeScript |
| Testability     | Jest setup, test coverage tracking     |
| Observability   | Audit logging, console diagnostics     |

### Gaps

| Quality       | Gap                                    |
| ------------- | -------------------------------------- |
| Scalability   | Single-instance, in-memory stores      |
| Performance   | No bundle analysis, no Core Web Vitals |
| Reliability   | No circuit breakers, limited retries   |
| Accessibility | WCAG audit incomplete                  |

---

## Internal Reasoning Notes

**Key Assumptions:**

- Architecture style classified as "layered monolith" based on directory structure
- Migration from Pages Router to App Router is ongoing (~50% based on docs)
- Feature flag system uses file-based persistence intentionally

**Confidence Drivers:**

- Directory structure clearly shows layer separation (High confidence)
- Route handler patterns consistent across API endpoints (High confidence)
- Security layers documented and implemented (High confidence)

**Alternative Interpretations Considered:**

- Could classify as "modular monolith" but lacks module boundaries
- Could classify as "serverless" but doesn't use serverless patterns
- Airtable usage suggests potential Jamstack influences
