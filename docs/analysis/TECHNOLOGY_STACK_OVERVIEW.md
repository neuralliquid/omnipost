# Technology Stack Overview

> **Document Type**: Phase 1a - Technology & Context Assessment
> **Last Updated**: December 2025
> **Project**: Content Creation Platform

---

## Executive Summary

The Content Creation Platform is a **Next.js-based SaaS application** designed for AI-powered content creation, management, and multi-platform publishing. Built with TypeScript in strict mode, it combines modern React patterns with robust API architecture and comprehensive security measures.

| Aspect           | Details                                                  |
| ---------------- | -------------------------------------------------------- |
| **Project Type** | SaaS / Content Management Platform                       |
| **Domain**       | Marketing / Content Creation / Social Media Management   |
| **Target Users** | Content creators, marketing teams, social media managers |
| **Scale**        | Small-to-medium teams (10-100 users)                     |
| **Deployment**   | Azure Web Apps (PaaS)                                    |
| **License**      | MIT                                                      |

---

## Frontend

### Core Framework

| Technology     | Version      | Purpose                                 |
| -------------- | ------------ | --------------------------------------- |
| **Next.js**    | 14+ (latest) | Full-stack React framework with SSR/SSG |
| **React**      | 18+ (latest) | UI component library                    |
| **TypeScript** | 5.3+         | Type-safe development (strict mode)     |

### UI & Styling

| Technology         | Purpose                  |
| ------------------ | ------------------------ |
| **CSS Modules**    | Component-scoped styling |
| **Global CSS**     | Application-wide styles  |
| **react-markdown** | Markdown rendering       |

### State Management

| Pattern           | Implementation                              |
| ----------------- | ------------------------------------------- |
| **Local State**   | React useState/useReducer                   |
| **Server State**  | Custom hooks with Axios                     |
| **Context**       | React Context API (authentication)          |
| **Feature Flags** | Custom feature flag system with persistence |

### Key Patterns

- Hybrid routing: Pages Router (legacy) + App Router (new)
- Custom hooks for business logic encapsulation
- Component-per-file organization by feature domain
- Error boundaries for graceful error handling

---

## Backend

### API Framework

| Technology               | Version | Purpose                             |
| ------------------------ | ------- | ----------------------------------- |
| **Next.js App Router**   | 14+     | Primary API routes (route handlers) |
| **Next.js Pages Router** | 14+     | Legacy API routes (being migrated)  |
| **Express**              | 5.1+    | Middleware patterns (rate limiting) |

### Authentication & Security

| Technology                           | Purpose                                  |
| ------------------------------------ | ---------------------------------------- |
| **jsonwebtoken**                     | JWT token generation/validation          |
| **Next.js Middleware**               | Route protection, token validation       |
| **DOMPurify / isomorphic-dompurify** | XSS prevention, HTML sanitization        |
| **Zod**                              | Runtime type validation and sanitization |
| **express-rate-limit**               | Rate limiting (in-memory)                |

### Security Features Implemented

- JWT-based authentication with token blacklisting
- Role-based access control (RBAC)
- Rate limiting with preset configurations (AUTH, AI_SERVICE, GENERAL, ADMIN)
- Input sanitization for all user inputs
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- URL sanitization with SSRF prevention
- Audit logging with sensitive data redaction

### API Architecture

```
Request → Rate Limit → Auth Middleware → Validation → Sanitization → Handler → Audit → Response
```

---

## Data & Storage

### Primary Storage

| Service      | Purpose                                |
| ------------ | -------------------------------------- |
| **Airtable** | Content storage, tracking, CMS backend |

### Local Storage

| Type              | Purpose                             |
| ----------------- | ----------------------------------- |
| **JSON files**    | Feature flags persistence (Node.js) |
| **localStorage**  | Feature flags persistence (Browser) |
| **In-memory Map** | Rate limiting, token blacklist      |

### Data Flow

```
User Input → API Route → Validation → Airtable API → Response
                                   ↓
                            Audit Log (Console)
```

### Content Schema (Conceptual)

- Content drafts with metadata
- Platform-specific adaptations
- Publishing queue items
- Engagement metrics tracking

---

## Tooling & Dev Experience

### Package Manager & Build

| Tool                    | Purpose                             |
| ----------------------- | ----------------------------------- |
| **npm**                 | Package management                  |
| **Next.js Build**       | Production builds with optimization |
| **TypeScript Compiler** | Type checking (strict mode)         |

### Code Quality

| Tool           | Version | Configuration                     |
| -------------- | ------- | --------------------------------- |
| **ESLint**     | Latest  | Next.js preset + TypeScript rules |
| **Prettier**   | 3.6+    | Consistent formatting             |
| **TypeScript** | 5.3+    | Strict mode enabled               |

### Scripts Available

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "type-check": "tsc --noEmit",
  "lint": "eslint .",
  "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,css,md}\"",
  "test": "jest",
  "test:coverage": "jest --coverage",
  "check-all": "npm run type-check && npm run lint && npm run format:check && npm run test"
}
```

### Path Aliases

```typescript
{
  "@/*": ["./*"],
  "@/components/*": ["components/*"],
  "@/lib/*": ["lib/*"],
  "@/hooks/*": ["hooks/*"],
  "@/types/*": ["types/*"]
}
```

---

## Testing & QA

### Testing Framework

| Tool                       | Version | Purpose                        |
| -------------------------- | ------- | ------------------------------ |
| **Jest**                   | 29.7+   | Test runner, assertions        |
| **React Testing Library**  | 16.3+   | Component testing              |
| **ts-jest**                | 29.3+   | TypeScript support             |
| **jest-environment-jsdom** | 29.7+   | Browser environment simulation |

### Test Organization

```
__tests__/
├── api/           # API route tests
│   ├── auth.test.ts
│   ├── feature-flags.test.ts
│   ├── images.test.ts
│   └── platforms.test.ts
├── integration/   # Integration tests (partially implemented)
├── lib/           # Unit tests for libraries
└── setup.ts       # Global test configuration
```

### Coverage Configuration

```javascript
collectCoverageFrom: [
  'app/**/*.{js,jsx,ts,tsx}',
  'components/**/*.{js,jsx,ts,tsx}',
  'lib/**/*.{js,jsx,ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
];
```

### Test Status

| Metric               | Value                              |
| -------------------- | ---------------------------------- |
| **Total Tests**      | 39                                 |
| **Passing**          | 38                                 |
| **Skipped**          | 1 (intentional - ESM import issue) |
| **Coverage Target**  | 80%+                               |
| **Current Coverage** | ~47%                               |

---

## Deployments & Ops

### Cloud Platform

| Service                   | Purpose                                 |
| ------------------------- | --------------------------------------- |
| **Azure Web Apps**        | Application hosting (Linux, Node.js 20) |
| **Azure Resource Groups** | Resource organization                   |

### Infrastructure as Code

| Tool           | Purpose                       |
| -------------- | ----------------------------- |
| **Bicep**      | Azure resource provisioning   |
| **PowerShell** | Deployment automation scripts |

### CI/CD Pipeline (GitHub Actions)

#### CI Workflow (`ci.yml`)

```yaml
Triggers: PR to main, Push to main
Jobs:
  1. lint-and-test:
    - Checkout
    - Setup Node.js 20.x
    - npm ci
    - Type check (tsc --noEmit)
    - Run tests (jest)
    - Format check (prettier)

  2. build (depends on lint-and-test):
    - Build application (next build)
```

#### Deployment Workflow (`azure-webapps-node.yml`)

```yaml
Triggers: Push to main, Manual dispatch
Environments: dev, test, prod (selectable)
Jobs: 1. build → 2. infrastructure (Bicep) → 3. deploy (Azure Web Apps)
```

### Environment Configuration

```bash
# Required
JWT_SECRET=<secure-secret>

# Optional - External Services
AIRTABLE_API_KEY=<key>
AIRTABLE_BASE_ID=<id>
HUGGING_FACE_API_KEY=<key>

# Optional - Notifications
SLACK_TOKEN=<token>
TWILIO_ACCOUNT_SID=<sid>
EMAIL_USER=<email>
```

### Security Headers (Production)

- `Strict-Transport-Security`: HSTS with preload
- `X-Frame-Options`: SAMEORIGIN
- `X-Content-Type-Options`: nosniff
- `Content-Security-Policy`: Comprehensive policy
- `Permissions-Policy`: Restrictive permissions

---

## External Integrations

### AI Services

| Service                   | Purpose                             | Rate Limit      |
| ------------------------- | ----------------------------------- | --------------- |
| **Hugging Face**          | Image generation (Stable Diffusion) | 10 req/min      |
| **OpenAI/DeepSeek/Azure** | Text parsing (configurable)         | Feature flagged |

### Content Storage

| Service      | Purpose                       |
| ------------ | ----------------------------- |
| **Airtable** | Primary content database, CMS |

### Social Platforms (Publishing)

| Platform  | Integration Status |
| --------- | ------------------ |
| Facebook  | API configured     |
| Instagram | API configured     |
| LinkedIn  | API configured     |
| Twitter/X | API configured     |

### Notification Services

| Service   | Technology               | Purpose            |
| --------- | ------------------------ | ------------------ |
| **Email** | Nodemailer (Gmail OAuth) | User notifications |
| **Slack** | @slack/web-api           | Team notifications |
| **SMS**   | Twilio                   | Mobile alerts      |

---

## Project Organization

### Directory Structure

```
content_creation/
├── app/                    # Next.js App Router
│   └── api/                # API routes (14 endpoints)
│       └── _utils/         # Shared utilities
├── pages/                  # Pages Router (legacy)
│   └── api/                # Legacy API routes
├── components/             # React components (~58 files)
│   ├── adaptation/         # Content adaptation
│   ├── automation/         # Automation tools
│   ├── content/            # Content management
│   ├── dashboard/          # Analytics
│   ├── feature-flags/      # Feature flag UI
│   ├── feedback/           # Feedback forms
│   ├── image/              # Image generation
│   ├── layouts/            # Page layouts
│   ├── platform/           # Platform connectors
│   ├── review/             # Review workflow
│   ├── series/             # Series management
│   ├── text/               # Text processing
│   └── ui/                 # Shared UI components
├── lib/                    # Business logic
│   ├── auth/               # Authentication
│   ├── clients/            # External API clients
│   ├── config/             # Platform configs
│   ├── data/               # Data access (Airtable)
│   └── storage/            # Storage utilities
├── hooks/                  # Custom React hooks (4 files)
├── types/                  # TypeScript definitions (4 files)
├── docs/                   # Documentation
├── infra/                  # Azure Bicep templates
└── __tests__/              # Test files
```

### Code Statistics

| Metric                   | Value        |
| ------------------------ | ------------ |
| **TypeScript/TSX Files** | ~120         |
| **Application Code**     | ~6,700 lines |
| **API Routes**           | 14 endpoints |
| **React Components**     | ~58          |
| **Custom Hooks**         | 4            |
| **Type Definitions**     | 4 files      |

### Team Structure (Inferred)

- **Primary Maintainer**: JustAGhosT (solo developer)
- **Development Pattern**: Solo/small team workflow
- **Code Style**: Consistent, well-organized feature-based structure

---

## Version Matrix

| Dependency             | Declared | Category    |
| ---------------------- | -------- | ----------- |
| next                   | latest   | Core        |
| react                  | latest   | Core        |
| react-dom              | latest   | Core        |
| typescript             | ^5.3.3   | Core        |
| jsonwebtoken           | ^9.0.2   | Security    |
| zod                    | ^3.24.3  | Validation  |
| dompurify              | ^3.2.5   | Security    |
| isomorphic-dompurify   | ^2.33.0  | Security    |
| axios                  | ^1.9.0   | HTTP        |
| @slack/web-api         | ^7.9.1   | Integration |
| twilio                 | ^5.5.2   | Integration |
| nodemailer             | ^7.0.7   | Integration |
| express                | ^5.1.0   | Server      |
| express-rate-limit     | ^7.1.5   | Security    |
| react-markdown         | ^10.1.0  | UI          |
| jest                   | ^29.7.0  | Testing     |
| @testing-library/react | ^16.3.0  | Testing     |
| eslint                 | latest   | Quality     |
| prettier               | ^3.6.2   | Quality     |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │  Components │  │    Custom Hooks         │  │
│  │  (Next.js)  │  │  (React)    │  │  (Business Logic)       │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          └────────────────┼─────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                     API LAYER (Next.js)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Middleware Layer                          ││
│  │  [Rate Limit] → [JWT Auth] → [RBAC] → [Audit]               ││
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
┌──────────────────────────┼──────────────────────────────────────┐
│                   EXTERNAL SERVICES                              │
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
┌──────────────────────────┼──────────────────────────────────────┐
│                   INFRASTRUCTURE                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Azure Web    │  │   GitHub     │  │      Bicep IaC         │ │
│  │    Apps      │  │   Actions    │  │    (Infrastructure)    │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

The Content Creation Platform represents a well-architected modern web application with:

**Strengths**:

- Modern React/Next.js foundation with TypeScript strict mode
- Comprehensive security implementation (auth, rate limiting, sanitization)
- Clean feature-based code organization
- Robust CI/CD pipeline with Azure deployment
- Extensive documentation

**Technical Debt**:

- Hybrid Pages/App Router migration in progress (~50% complete)
- In-memory rate limiting (needs Redis for multi-instance)
- Test coverage below 80% target
- Mock authentication (needs real database integration)

**Scale Characteristics**:

- Suitable for small-to-medium workloads
- Single-instance deployment (in-memory stores)
- External service dependencies for heavy lifting (AI, storage)

---

_This document serves as the authoritative technology reference for the Content Creation Platform._
