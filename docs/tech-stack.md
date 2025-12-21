# Technology Stack — OmniPost

> **Document Status:** Phase 2 Discovery Output
> **Source:** Extracted from `package.json`, `tsconfig.json`, and repository structure

---

## Executive Summary

OmniPost is a **Next.js-based SaaS application** for AI-powered multi-platform content publishing. Built with TypeScript in strict mode, the stack combines modern React patterns with comprehensive security and Azure-native deployment.

| Aspect       | Details                                                |
| ------------ | ------------------------------------------------------ |
| Project Type | SaaS / Content Management Platform                     |
| Domain       | Marketing / Content Creation / Social Media Management |
| Target Users | Content creators, marketing teams, SMBs                |
| Scale        | Small-to-medium teams (10-100 users)                   |
| Deployment   | Azure Web Apps (PaaS)                                  |
| Architecture | Layered monolith with API-first design                 |

---

## Frontend Stack

### Core Framework

| Technology | Version  | Purpose                                 | Confidence |
| ---------- | -------- | --------------------------------------- | ---------- |
| Next.js    | ^16.0.10 | Full-stack React framework with SSR/SSG | High       |
| React      | ^19.2.1  | UI component library                    | High       |
| React DOM  | ^19.2.1  | DOM rendering for React                 | High       |
| TypeScript | ^5.3.3   | Type-safe development (strict mode)     | High       |

### UI & Styling

| Technology     | Purpose                  | Confidence |
| -------------- | ------------------------ | ---------- |
| CSS Modules    | Component-scoped styling | High       |
| Global CSS     | Application-wide styles  | High       |
| react-markdown | Markdown rendering       | High       |

### State Management

| Pattern       | Implementation                      | Confidence |
| ------------- | ----------------------------------- | ---------- |
| Local State   | React useState/useReducer           | High       |
| Server State  | Custom hooks with Axios             | High       |
| Context       | React Context API (authentication)  | High       |
| Feature Flags | Custom system with JSON persistence | High       |

---

## Backend Stack

### API Framework

| Technology           | Version  | Purpose                             | Confidence |
| -------------------- | -------- | ----------------------------------- | ---------- |
| Next.js App Router   | ^16.0.10 | Primary API routes (route handlers) | High       |
| Next.js Pages Router | ^16.0.10 | Legacy API routes (being migrated)  | High       |
| Express              | ^5.2.1   | Middleware patterns (rate limiting) | High       |

### Authentication & Security

| Technology           | Version | Purpose                           | Confidence |
| -------------------- | ------- | --------------------------------- | ---------- |
| jsonwebtoken         | ^9.0.2  | JWT token generation/validation   | High       |
| bcryptjs             | ^3.0.3  | Password hashing                  | High       |
| DOMPurify            | ^3.2.5  | XSS prevention, HTML sanitization | High       |
| isomorphic-dompurify | ^2.33.0 | SSR-safe DOMPurify                | High       |
| Zod                  | ^3.24.3 | Runtime type validation           | High       |
| express-rate-limit   | ^7.1.5  | Rate limiting (in-memory)         | High       |
| @upstash/ratelimit   | ^2.0.7  | Distributed rate limiting         | High       |
| @upstash/redis       | ^1.35.7 | Redis client for rate limiting    | High       |

### Security Features Implemented

- JWT-based authentication with token blacklisting
- Rate limiting with preset configurations (AUTH, AI_SERVICE, GENERAL, ADMIN)
- Input sanitization for all user inputs via Zod + DOMPurify
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- URL sanitization with SSRF prevention
- Audit logging with sensitive data redaction

---

## Data & Storage

### Primary Storage

| Service  | Purpose                                 | Confidence |
| -------- | --------------------------------------- | ---------- |
| Airtable | Content storage, tracking, CMS backend  | High       |
| Prisma   | ORM for database operations             | High       |
| SQLite   | Local development database (via Prisma) | Inferred   |

### Runtime Storage

| Type          | Purpose                             | Confidence |
| ------------- | ----------------------------------- | ---------- |
| JSON files    | Feature flags persistence (Node.js) | High       |
| localStorage  | Feature flags persistence (Browser) | High       |
| In-memory Map | Rate limiting, token blacklist      | High       |

---

## Tooling & Developer Experience

### Package Manager & Build

| Tool          | Version  | Purpose                             | Confidence |
| ------------- | -------- | ----------------------------------- | ---------- |
| pnpm          | 9.0.0    | Package management                  | High       |
| Next.js Build | ^16.0.10 | Production builds with optimization | High       |
| TypeScript    | ^5.3.3   | Type checking (strict mode)         | High       |

### Code Quality

| Tool       | Version | Configuration                     | Confidence |
| ---------- | ------- | --------------------------------- | ---------- |
| ESLint     | ^9.39.1 | Next.js preset + TypeScript rules | High       |
| Prettier   | ^3.6.2  | Consistent formatting             | High       |
| TypeScript | ^5.3.3  | Strict mode enabled               | High       |

### Path Aliases

```typescript
{
  "@/*": ["./*"],
  "@/components/*": ["components/*"],
  "@/lib/*": ["lib/*"],
  "@/hooks/*": ["hooks/*"],
  "@/types/*": ["types/*"],
  "@/styles/*": ["styles/*"],
  "@/data/*": ["data/*"]
}
```

---

## Testing Stack

### Testing Framework

| Tool                      | Version | Purpose                        | Confidence |
| ------------------------- | ------- | ------------------------------ | ---------- |
| Jest                      | ^29.7.0 | Test runner, assertions        | High       |
| React Testing Library     | ^16.3.0 | Component testing              | High       |
| @testing-library/jest-dom | ^6.6.3  | DOM matchers                   | High       |
| ts-jest                   | ^29.3.2 | TypeScript support             | High       |
| jest-environment-jsdom    | ^29.7.0 | Browser environment simulation | High       |

### Test Organization

```
__tests__/
├── api/           # API route tests
├── integration/   # Integration tests
├── lib/           # Library unit tests
└── setup.ts       # Global test configuration
```

### Test Metrics

| Metric           | Value | Status      |
| ---------------- | ----- | ----------- |
| Total Tests      | 39    | Documented  |
| Passing          | 26    | 66%         |
| Failing          | 13    | Mock issues |
| Coverage Target  | 80%+  | Defined     |
| Current Coverage | ~47%  | Gap exists  |

---

## Deployment & Infrastructure

### Cloud Platform

| Service               | Purpose                                 | Confidence |
| --------------------- | --------------------------------------- | ---------- |
| Azure Web Apps        | Application hosting (Linux, Node.js 20) | High       |
| Azure Resource Groups | Resource organization                   | High       |

### Infrastructure as Code

| Tool       | Purpose                       | Confidence |
| ---------- | ----------------------------- | ---------- |
| Bicep      | Azure resource provisioning   | High       |
| PowerShell | Deployment automation scripts | High       |

### CI/CD Pipeline (GitHub Actions)

| Workflow                          | Triggers                      | Purpose          |
| --------------------------------- | ----------------------------- | ---------------- |
| CI (`ci.yml`)                     | PR to main, Push to main      | Quality gates    |
| Deploy (`azure-webapps-node.yml`) | Push to main, Manual dispatch | Azure deployment |

#### CI Pipeline Stages

1. Checkout code
2. Setup Node.js 20.x
3. pnpm install
4. Type check (`tsc --noEmit`)
5. Run tests (`jest`)
6. Format check (`prettier`)
7. Build (`next build`)

---

## External Integrations

### AI Services

| Service               | Purpose                             | Rate Limit      | Confidence |
| --------------------- | ----------------------------------- | --------------- | ---------- |
| Hugging Face          | Image generation (Stable Diffusion) | 10 req/min      | High       |
| OpenAI/DeepSeek/Azure | Text parsing (configurable)         | Feature flagged | High       |

### Content Storage

| Service  | Purpose                       | Confidence |
| -------- | ----------------------------- | ---------- |
| Airtable | Primary content database, CMS | High       |

### Social Platforms (Publishing)

| Platform  | Integration Status | Confidence |
| --------- | ------------------ | ---------- |
| Facebook  | API configured     | High       |
| Instagram | API configured     | High       |
| LinkedIn  | API configured     | High       |
| Twitter/X | API configured     | High       |

### Notification Services

| Service | Technology              | Purpose            | Confidence |
| ------- | ----------------------- | ------------------ | ---------- |
| Email   | Nodemailer (^7.0.11)    | User notifications | High       |
| Slack   | @slack/web-api (^7.9.1) | Team notifications | High       |
| SMS     | Twilio (^5.5.2)         | Mobile alerts      | High       |

---

## Version Matrix

### Production Dependencies

| Package              | Version  | Category    |
| -------------------- | -------- | ----------- |
| next                 | ^16.0.10 | Core        |
| react                | ^19.2.1  | Core        |
| react-dom            | ^19.2.1  | Core        |
| typescript           | ^5.3.3   | Core        |
| @prisma/client       | ^7.1.0   | Data        |
| prisma               | ^7.1.0   | Data        |
| airtable             | ^0.12.2  | Data        |
| axios                | ^1.9.0   | HTTP        |
| jsonwebtoken         | ^9.0.2   | Security    |
| bcryptjs             | ^3.0.3   | Security    |
| zod                  | ^3.24.3  | Validation  |
| dompurify            | ^3.2.5   | Security    |
| isomorphic-dompurify | ^2.33.0  | Security    |
| express              | ^5.2.1   | Server      |
| express-rate-limit   | ^7.1.5   | Security    |
| @upstash/ratelimit   | ^2.0.7   | Security    |
| @upstash/redis       | ^1.35.7  | Storage     |
| @slack/web-api       | ^7.9.1   | Integration |
| twilio               | ^5.5.2   | Integration |
| nodemailer           | ^7.0.11  | Integration |
| react-markdown       | ^10.1.0  | UI          |
| p-limit              | ^7.2.0   | Utility     |

### Development Dependencies

| Package                   | Version  | Category |
| ------------------------- | -------- | -------- |
| jest                      | ^29.7.0  | Testing  |
| @testing-library/react    | ^16.3.0  | Testing  |
| @testing-library/jest-dom | ^6.6.3   | Testing  |
| ts-jest                   | ^29.3.2  | Testing  |
| eslint                    | ^9.39.1  | Quality  |
| eslint-config-next        | ^16.0.8  | Quality  |
| prettier                  | ^3.6.2   | Quality  |
| @types/react              | ^18.2.48 | Types    |
| @types/node               | ^20.11.5 | Types    |

---

## Risk Surfaces

### Security Risks

| Risk                    | Severity | Mitigation Status          |
| ----------------------- | -------- | -------------------------- |
| In-memory rate limiting | Medium   | Works single-instance only |
| JWT token storage       | Low      | HttpOnly cookies planned   |
| Third-party API keys    | Medium   | Environment variables      |
| Input validation gaps   | Low      | Zod schemas in place       |

### Performance Risks

| Risk                        | Severity | Notes                 |
| --------------------------- | -------- | --------------------- |
| Bundle size not monitored   | Low      | No bundle analyzer    |
| No Redis for multi-instance | Medium   | Upstash deps added    |
| No CDN for static assets    | Low      | Azure handles caching |

### Scalability Risks

| Risk                       | Severity | Notes                    |
| -------------------------- | -------- | ------------------------ |
| Single-instance deployment | Medium   | In-memory stores         |
| Airtable as primary DB     | Medium   | Limited scalability      |
| No caching layer           | Low      | SWR/React Query not used |

### Maintainability Risks

| Risk                       | Severity | Notes                     |
| -------------------------- | -------- | ------------------------- |
| Hybrid Pages/App Router    | Medium   | Migration ~50% complete   |
| Test coverage below target | Medium   | Currently 47%, target 80% |
| Mock authentication        | High     | Needs production auth     |

---

## Internal Reasoning Notes

**Assumptions:**

- Version numbers extracted from `package.json` are accurate as of analysis date
- Prisma/SQLite integration inferred from dependencies but usage extent unclear
- Upstash Redis dependencies suggest distributed rate limiting capability exists

**Confidence Drivers:**

- `package.json` provides explicit version declarations (High confidence)
- `tsconfig.json` confirms TypeScript strict mode (High confidence)
- CI workflows confirm tooling pipeline (High confidence)
- Test status documents provide coverage metrics (High confidence)

**Alternative Interpretations Considered:**

- Express may be used for more than rate limiting
- Prisma integration may be partial or in development
- Upstash dependencies may not be actively used yet
