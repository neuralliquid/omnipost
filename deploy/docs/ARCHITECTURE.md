# Architecture Documentation

This document provides a comprehensive overview of OmniPost's architecture, design decisions, and technical implementation details.

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [API Architecture](#api-architecture)
5. [Security Model](#security-model)
6. [Data Flow](#data-flow)
7. [Feature Flags System](#feature-flags-system)
8. [AI Integration](#ai-integration)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Architecture](#deployment-architecture)

## System Overview

OmniPost is a Next.js-based web application that enables users to create, manage, and publish content across multiple platforms. The system integrates AI-powered features for text processing and image generation, with a focus on seamless multi-platform publishing.

### Key Capabilities

- **Multi-platform Publishing**: Publish content to Facebook, Instagram, LinkedIn, Twitter, and custom platforms from one interface
- **AI-Powered Processing**: Text summarization, parsing, and image generation using Hugging Face and Azure AI models
- **Content Management**: Draft, review, approval, and scheduling workflows
- **Platform Integration**: Direct API integration with social media platforms
- **Analytics**: Engagement tracking and performance metrics

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│  (React Components, Pages, Client-Side State Management)    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                     Next.js App Router                       │
│              (API Routes, Middleware, SSR/SSG)               │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    Business Logic Layer                      │
│  (Authentication, Authorization, Feature Flags, Validation)  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                   External Services Layer                    │
│     (Airtable, Hugging Face, Slack, Twilio, Nodemailer)    │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **Framework**: Next.js 14 (Hybrid Pages + App Router)
- **UI Library**: React 18
- **Language**: TypeScript 5.3 (strict mode)
- **Styling**: CSS Modules + Global CSS
- **State Management**: React hooks (useState, useEffect, useContext)

### Backend

- **API**: Next.js App Router (route handlers) + Legacy Pages API routes
- **Runtime**: Node.js
- **Authentication**: JWT-based with middleware
- **Validation**: Zod schemas
- **Security**: DOMPurify for sanitization, rate limiting, security headers

### Infrastructure

- **Deployment**: Azure Web Apps
- **IaC**: Bicep templates
- **CI/CD**: GitHub Actions
- **Testing**: Jest + React Testing Library

### External Services

- **Data Storage**: Airtable
- **AI Services**: Hugging Face (image generation)
- **Notifications**: Slack, Twilio (SMS), Nodemailer (email)

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
├── pages/                    # Next.js Pages Router
│   ├── api/                  # Legacy API routes (being migrated)
│   ├── index.tsx             # Landing page
│   ├── automation.tsx        # Automation tools page
│   ├── content-adaptation.tsx
│   ├── human-review.tsx
│   ├── performance-dashboard.tsx
│   ├── platform-analysis.tsx
│   ├── series.tsx
│   ├── workflow.tsx
│   └── 404.tsx
│
├── components/               # React components
│   ├── adaptation/           # Content adaptation components
│   ├── automation/           # Automation tool components
│   ├── content/              # Content management
│   ├── dashboard/            # Dashboard & analytics
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
├── lib/                      # Shared libraries
│   ├── api-client.ts         # API client utilities
│   ├── auth/                 # Authentication logic
│   ├── clients/              # External service clients
│   ├── data/                 # Data access layer
│   └── storage/              # Storage utilities
│
├── hooks/                    # Custom React hooks
├── middleware/               # Express-style middleware
├── middleware.ts             # Next.js middleware
├── types/                    # TypeScript type definitions
├── utils/                    # Utility functions
├── config/                   # Configuration files
├── content/                  # Static content data
├── data/                     # Application data
├── styles/                   # CSS modules and global styles
├── __tests__/                # Test files
│   ├── api/                  # API tests
│   ├── integration/          # Integration tests
│   └── lib/                  # Library tests
│
├── docs/                     # Documentation
│   ├── api/                  # API documentation
│   ├── guides/               # Developer guides
│   └── archived/             # Historical documentation
│
├── infra/                    # Infrastructure as Code
└── scripts/                  # Build and utility scripts
```

## API Architecture

### Route Handler Pattern (App Router)

All new API routes use the Next.js App Router pattern with consistent security patterns:

```typescript
export const POST = withRateLimit(
  withErrorHandling(async (request: Request) => {
    // 1. Authentication check
    if (!(await isAuthenticated())) {
      return Errors.unauthorized();
    }

    // 2. Input validation and sanitization
    const body = await request.json();
    const validation = validateAndSanitize(schema, body);
    if (!validation.success) {
      return Errors.badRequest(validation.errors);
    }

    // 3. Authorization check (if needed)
    const user = await getCurrentUser();
    if (!hasPermission(user, 'required-permission')) {
      return Errors.forbidden();
    }

    // 4. Business logic
    const result = await performOperation(validation.data);

    // 5. Audit logging
    await auditLog('OPERATION_NAME', user.id, { ...context });

    // 6. Response
    return Response.json({ success: true, data: result });
  }),
  '/api/route-path',
  RateLimitPresets.GENERAL
);
```

### Security Layers

1. **Rate Limiting**: Applied via `withRateLimit` wrapper
2. **Authentication**: JWT-based, checked via `isAuthenticated()`
3. **Authorization**: Role-based access control via `hasPermission()`
4. **Input Validation**: Zod schemas for type-safe validation
5. **Input Sanitization**: DOMPurify for XSS prevention
6. **Error Handling**: Consistent error responses via `Errors` utility
7. **Audit Logging**: All actions logged for compliance

### Rate Limiting Strategy

Different endpoints have different rate limits based on resource consumption:

- **Auth endpoints**: 5 requests per 15 minutes (strict)
- **AI endpoints**: 10 requests per minute (cost-aware)
- **General endpoints**: 100 requests per 15 minutes (standard)

## Security Model

### Authentication Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │ POST /api/auth (username, password)
     ▼
┌─────────────────┐
│  Auth Handler   │
│  - Validate     │
│  - Hash compare │
│  - Generate JWT │
└────┬────────────┘
     │ { token, user }
     ▼
┌─────────┐
│ Client  │
│ (Store  │
│  token) │
└────┬────┘
     │ Subsequent requests
     │ Authorization: Bearer <token>
     ▼
┌─────────────────┐
│   Middleware    │
│  - Verify JWT   │
│  - Attach user  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  API Handler    │
│  - Check auth   │
│  - Check perms  │
│  - Process      │
└─────────────────┘
```

### Security Headers

The application sets the following security headers:

- `X-Frame-Options`: DENY
- `X-Content-Type-Options`: nosniff
- `Referrer-Policy`: strict-origin-when-cross-origin
- `Permissions-Policy`: Restrictive permissions
- `Content-Security-Policy`: Comprehensive CSP
- `Strict-Transport-Security`: HSTS enabled

### Input Sanitization

All user input is sanitized using DOMPurify before processing:

```typescript
const sanitized = sanitizeInput(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href'],
});
```

## Data Flow

### Content Creation Flow

```
1. User creates content → Draft stored in Airtable
2. AI processing (optional) → Text summarization, image generation
3. Platform adaptation → Format for each target platform
4. Review queue → Human approval
5. Scheduling → Queue for publication
6. Publishing → API calls to platforms
7. Analytics → Track engagement metrics
```

### AI Processing Flow

```
┌──────────────┐
│ User Input   │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Parse API        │
│ - Extract text   │
│ - Clean format   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Summarize API    │
│ - HuggingFace    │
│ - Generate       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Image API        │
│ - HuggingFace    │
│ - Generate       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Content Store    │
│ - Airtable       │
└──────────────────┘
```

## Feature Flags System

Feature flags enable/disable functionality without code deployments:

```typescript
interface FeatureFlags {
  imageGeneration: boolean;
  textParser: boolean;
  summarization: boolean;
  platformIntegration: boolean;
  notifications: boolean;
  analytics: boolean;
}
```

Flags are stored in `data/feature-flags.json` and can be toggled via the admin UI or API.

## AI Integration

### Hugging Face Integration

The platform uses Hugging Face models for AI capabilities:

- **Image Generation**: Stable Diffusion models
- **Text Processing**: Summarization and NLP models

Configuration:

```typescript
const HF_API_URL = 'https://api-inference.huggingface.co/models';
const DEFAULT_MODEL = 'stabilityai/stable-diffusion-2-1';
```

### Rate Limiting for AI

AI endpoints have stricter rate limiting to manage costs:

- 10 requests per minute per user
- Fallback to cached results when available
- Queue system for batch processing

## Testing Strategy

### Test Structure

```
__tests__/
├── api/              # API route tests
├── integration/      # Integration tests
└── lib/              # Unit tests for libraries
```

### Testing Tools

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing
- **Supertest**: API testing
- **ts-jest**: TypeScript support

### Coverage Goals

- **Target**: 80%+ code coverage
- **Current**: ~47% (being improved)
- **Priority**: Critical paths (auth, API routes, security)

## Deployment Architecture

### Azure Web Apps

The application is deployed to Azure Web Apps with the following configuration:

```
Environment: Production
Region: [Configured in infra/parameters.json]
Node Version: 18.x
Scaling: Auto-scale based on CPU/Memory
```

### Infrastructure as Code

Bicep templates define all Azure resources:

- App Service Plan
- Web App
- Application Insights (planned)
- Key Vault (planned)

### Environment Variables

Required environment variables (see `.env.example`):

- `JWT_SECRET`: Secret for JWT signing
- `HUGGING_FACE_API_KEY`: API key for Hugging Face
- `AIRTABLE_API_KEY`: API key for Airtable
- `AIRTABLE_BASE_ID`: Airtable base identifier
- Various platform API keys (Slack, Twilio, etc.)

### CI/CD Pipeline

GitHub Actions workflow:

1. Install dependencies
2. Run linting
3. Run type checking
4. Run tests
5. Build application
6. Deploy to Azure (on main branch)

## Best Practices

### Code Organization

1. **Components**: One component per file, named exports
2. **API Routes**: Follow security pattern consistently
3. **Types**: Define interfaces for all data structures
4. **Tests**: Co-locate tests with source files or in `__tests__`

### Security

1. **Always await** `isAuthenticated()`
2. **Always sanitize** user input
3. **Always validate** with Zod schemas
4. **Always rate limit** public endpoints
5. **Never log** sensitive data

### Performance

1. Use React.memo() for expensive components
2. Implement proper loading states
3. Optimize images with Next.js Image component
4. Lazy load components when appropriate
5. Cache API responses when possible

## Migration Status

### Pages Router to App Router

The project is migrating from Pages Router to App Router:

- **API Routes**: 50% migrated (see `docs/api/api-migration-todo.md`)
- **Pages**: Still using Pages Router
- **New Development**: Use App Router for all new features

### Known Issues

See `docs/archived/FINDINGS_DETAILED.md` for a comprehensive list of known issues and their status.

## Related Documentation

- [API Migration Guide](./api/api-migration-todo.md)
- [API Best Practices](./api/next-api-best-practices.md)
- [Frontend Guides](./guides/next-best-practices/)
- [Security Policy](../SECURITY.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

**Last Updated**: November 23, 2025
**Maintained By**: Development Team
