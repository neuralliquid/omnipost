# GitHub Copilot Instructions for OmniPost

## 📌 Quick Reference

**Repository:** phoenixvc/omnipost  
**Live Demo:** [https://nl-dev-omnipost-app.azurewebsites.net](https://nl-dev-omnipost-app.azurewebsites.net)

## Project Overview

This is OmniPost - an AI-powered multi-platform content publishing platform built with Next.js 14, React 18, and TypeScript. The platform enables seamless publishing across all major social media platforms with AI-powered text processing and image generation capabilities.

**Project Name:** OmniPost  
**Project Type:** SaaS Multi-Platform Publishing Platform  
**Target Users:** Content creators, marketing teams, SMBs, social media managers  
**Core Value:** "Publish everywhere, manage anywhere"  
**Tagline:** "One platform. All channels."

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x (see `.nvmrc`)
- pnpm (package manager)
- Git

### Quick Setup

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Start development server
pnpm dev
```

### Essential Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Build for production
pnpm type-check       # TypeScript validation

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Coverage report

# Quality Checks
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint issues
pnpm format           # Format with Prettier
pnpm format:check     # Check formatting
pnpm check-all        # Run all quality checks
```

## Technology Stack

### Frontend

- **Framework:** Next.js 14 (Hybrid Pages + App Router)
- **UI Library:** React 18
- **Language:** TypeScript 5.3 (strict mode enabled)
- **Styling:** CSS Modules + Global CSS
- **State Management:** React hooks (useState, useEffect, useContext)

### Backend

- **API:** Next.js App Router (route handlers) + Legacy Pages API routes
- **Authentication:** JWT-based with middleware
- **Validation:** Zod schemas
- **Security:** DOMPurify for sanitization, rate limiting, security headers

### Infrastructure

- **Deployment:** Azure Web Apps
- **IaC:** Terraform for active Azure runtime; legacy Bicep workflow is disabled
- **CI/CD:** GitHub Actions
- **Testing:** Jest + React Testing Library

### External Services

- AI services (Hugging Face for image generation)
- Airtable (data storage)
- Slack (notifications)
- Twilio (SMS)
- Nodemailer (email)

## Code Style & Standards

### TypeScript

- **ALWAYS** use TypeScript strict mode
- **ALWAYS** define explicit types for function parameters and return values
- **ALWAYS** use interfaces for object shapes, types for unions/primitives
- **AVOID** `any` type - use `unknown` if type is truly unknown
- **PREFER** type inference where obvious, but be explicit for public APIs

```typescript
// ✅ Good
interface ContentItem {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
}

async function createContent(data: ContentItem): Promise<ContentItem> {
  // Implementation
}

// ❌ Bad
function createContent(data: any): any {
  // Implementation
}
```

### React Components

- **ALWAYS** use functional components with hooks
- **ALWAYS** define component prop types with TypeScript interfaces
- **PREFER** named exports over default exports for components
- **USE** CSS Modules for component-specific styles
- **EXTRACT** complex logic into custom hooks

```typescript
// ✅ Good
interface ContentCardProps {
  title: string;
  description: string;
  onEdit: () => void;
}

export function ContentCard({ title, description, onEdit }: ContentCardProps) {
  return <div className={styles.card}>...</div>;
}

// ❌ Bad
export default function ContentCard(props: any) {
  return <div>...</div>;
}
```

### API Routes (App Router)

- **ALWAYS** use async route handlers
- **ALWAYS** validate input with Zod schemas
- **ALWAYS** sanitize user input using the sanitization utilities
- **ALWAYS** check authentication using `await isAuthenticated()`
- **ALWAYS** apply rate limiting to protected endpoints
- **RETURN** proper HTTP status codes with error messages

```typescript
// ✅ Good
import { withRateLimit, RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { validateAndSanitize, textInputSchema } from '@/app/api/_utils/sanitize';
import { isAuthenticated } from '@/app/api/_utils/auth';

export const POST = withRateLimit(
  async (request: Request) => {
    // Check authentication (ALWAYS await!)
    if (!(await isAuthenticated())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate input
    const body = await request.json();
    const validation = validateAndSanitize(textInputSchema, body);

    if (!validation.success) {
      return Response.json({ error: 'Invalid input', details: validation.errors }, { status: 400 });
    }

    // Use sanitized data
    const { content } = validation.data;

    // Business logic here
    return Response.json({ success: true }, { status: 200 });
  },
  '/api/content/create',
  RateLimitPresets.GENERAL
);

// ❌ Bad
export async function POST(request: Request) {
  if (!isAuthenticated()) {
    // Missing await!
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  // No validation or sanitization - XSS vulnerability!
  const content = body.content;

  return Response.json({ success: true });
}
```

## Critical Security Rules

### 1. Authentication

- **ALWAYS** use `await isAuthenticated()` - it's an async function!
- **NEVER** forget the `await` keyword when checking authentication
- **ALWAYS** return 401 for unauthenticated requests
- **ALWAYS** validate JWT tokens properly

```typescript
// ✅ Correct
if (!(await isAuthenticated())) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// ❌ WRONG - Missing await!
if (!isAuthenticated()) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 2. Input Sanitization

- **ALWAYS** sanitize user input using DOMPurify
- **ALWAYS** validate with Zod schemas before processing
- **USE** the utilities in `app/api/_utils/sanitize.ts`
- **NEVER** trust user input or insert it directly into HTML/DB

```typescript
import { validateAndSanitize, textInputSchema } from '@/app/api/_utils/sanitize';

// ✅ Good
const validation = validateAndSanitize(textInputSchema, userInput);
if (!validation.success) {
  return Response.json({ error: validation.errors.join(', ') }, { status: 400 });
}
const { sanitizedContent } = validation.data;

// ❌ Bad - No sanitization!
const content = userInput.content; // XSS vulnerability!
```

### 3. Rate Limiting

- **ALWAYS** apply rate limiting to public endpoints
- **ALWAYS** apply strict rate limiting to auth endpoints (5 req/15min)
- **ALWAYS** apply cost-aware limiting to AI endpoints (10 req/min)
- **USE** the utilities in `app/api/_utils/rateLimit.ts`

```typescript
import { withRateLimit, RateLimitPresets } from '@/app/api/_utils/rateLimit';

// ✅ Good
export const POST = withRateLimit(
  async (request: Request) => {
    /* handler */
  },
  '/api/auth/login',
  RateLimitPresets.AUTH
);

// ❌ Bad - No rate limiting!
export async function POST(request: Request) {
  /* handler */
}
```

### 4. Error Handling

- **ALWAYS** wrap components in error boundaries for crash prevention
- **ALWAYS** provide user-friendly error messages
- **NEVER** expose stack traces or sensitive info in production
- **LOG** errors for debugging but sanitize logs

```typescript
// ✅ Good
try {
  const result = await performOperation();
  return Response.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return Response.json({ error: 'Failed to complete operation' }, { status: 500 });
}

// ❌ Bad
try {
  const result = await performOperation();
  return Response.json(result);
} catch (error) {
  return Response.json({ error: error.stack }, { status: 500 }); // Exposes stack!
}
```

### 5. Environment Variables

- **ALWAYS** validate required env vars at startup
- **NEVER** commit secrets or API keys
- **USE** `.env.local` for local development
- **CHECK** for missing env vars and fail fast

```typescript
// ✅ Good - Startup validation
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET is required but not set');
}

// ❌ Bad - No validation
const secret = process.env.JWT_SECRET; // Might be undefined!
```

## API Development Guidelines

### Route Structure

- Place new routes in `app/api/` directory
- Follow RESTful conventions: GET, POST, PUT, DELETE
- Use descriptive route names: `/api/content/[id]/publish`
- Group related routes in folders

### Error Responses

Use consistent error response format:

```typescript
// Standard error response
return Response.json(
  {
    error: 'Short error message',
    details: 'More detailed explanation',
    code: 'ERROR_CODE',
  },
  { status: 400 }
);
```

### Success Responses

Use consistent success response format:

```typescript
// Standard success response
return Response.json(
  {
    success: true,
    data: {
      /* result data */
    },
    message: 'Operation completed successfully',
  },
  { status: 200 }
);
```

## Testing Guidelines

### Test Structure

- Place tests in `__tests__/` directory
- Mirror the source file structure
- Use descriptive test names: `should return 401 when user is not authenticated`
- Group related tests with `describe` blocks

### Testing Best Practices

- **ALWAYS** test happy path and error cases
- **ALWAYS** test authentication and authorization
- **ALWAYS** mock external services
- **ALWAYS** test input validation
- **USE** React Testing Library for component tests
- **USE** Jest for unit and API tests

```typescript
// ✅ Good test structure
describe('POST /api/content/create', () => {
  it('should create content when authenticated and input is valid', async () => {
    // Arrange
    const mockContent = { title: 'Test', body: 'Content' };

    // Act
    const response = await createContent(mockContent);

    // Assert
    expect(response.status).toBe(201);
    expect(response.data).toMatchObject(mockContent);
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await createContent({});
    expect(response.status).toBe(401);
  });

  it('should return 400 when input validation fails', async () => {
    const response = await createContent({ invalid: 'data' });
    expect(response.status).toBe(400);
  });
});
```

## Component Development

### Component Organization

```
components/
├── ui/              # Reusable UI primitives (Button, Input, Card)
├── features/        # Feature-specific components
├── layouts/         # Layout components
└── forms/           # Form components
```

### Accessibility

- **ALWAYS** use semantic HTML elements
- **ALWAYS** add ARIA labels to interactive elements
- **ALWAYS** ensure keyboard navigation works
- **ALWAYS** test with screen readers when possible
- **MAINTAIN** color contrast ratio of 4.5:1 minimum

```typescript
// ✅ Good - Accessible button
<button
  type="button"
  onClick={handleClick}
  aria-label="Delete content item"
  disabled={isLoading}
>
  Delete
</button>

// ❌ Bad - Not accessible
<div onClick={handleClick}>Delete</div>
```

### Performance

- **USE** React.memo() for expensive components
- **USE** useMemo() and useCallback() to prevent unnecessary re-renders
- **LAZY LOAD** components with dynamic imports when appropriate
- **OPTIMIZE** images with Next.js Image component

## Migration Notes

### App Router Migration

- The project is **migrating from Pages Router to App Router**
- New API routes: Use App Router in `app/api/`
- Legacy routes in `pages/api/` are being phased out
- Refer to `docs/api-migration.md` for migration status

### When Creating New Routes

- **ALWAYS** use App Router (`app/api/`) for new routes
- **FOLLOW** the security patterns in existing App Router routes
- **DO NOT** add new routes to `pages/api/` (legacy)

## Common Patterns

### Authentication Check Pattern

```typescript
export const POST = withRateLimit(
  withErrorHandling(async (request: Request) => {
    if (!(await isAuthenticated())) {
      return Errors.unauthorized();
    }
    // Handler logic
  }),
  '/api/route-path',
  RateLimitPresets.GENERAL
);
```

### Input Validation Pattern

```typescript
const body = await request.json();
const validation = validateAndSanitize(schemaName, body);

if (!validation.success) {
  return Response.json({ error: 'Invalid input', details: validation.errors }, { status: 400 });
}

const { field1, field2 } = validation.data;
```

### Error Handling Pattern

```typescript
try {
  const result = await operation();
  return Response.json({ success: true, data: result });
} catch (error) {
  console.error('Operation failed:', error);
  return Response.json({ error: 'Operation failed' }, { status: 500 });
}
```

## File Naming Conventions

- **Components:** PascalCase (`ContentCard.tsx`)
- **Utilities:** camelCase (`formatDate.ts`)
- **API Routes:** lowercase with kebab-case folders (`app/api/content-items/route.ts`)
- **Types:** PascalCase (`ContentItem.ts`)
- **Tests:** Match source file with `.test` suffix (`ContentCard.test.tsx`)
- **CSS Modules:** Match component name (`ContentCard.module.css`)

## Code Review Checklist

Before submitting code, ensure:

- [ ] TypeScript strict mode passes with no errors
- [ ] ESLint passes with no errors (`npm run lint`)
- [ ] Prettier formatting applied (`npm run format`)
- [ ] Tests pass (`npm test`)
- [ ] Authentication checks use `await isAuthenticated()`
- [ ] Input validation and sanitization applied
- [ ] Rate limiting applied to public endpoints
- [ ] Error handling implemented
- [ ] No secrets or sensitive data in code
- [ ] Accessibility requirements met
- [ ] Documentation updated if needed

## Documentation Standards

### Code Comments

- **USE** JSDoc for public functions and complex logic
- **EXPLAIN** why, not what (code should be self-explanatory)
- **DOCUMENT** complex algorithms and business rules
- **MARK** TODOs with clear context

```typescript
/**
 * Processes content for multi-platform publishing.
 *
 * Applies platform-specific transformations including:
 * - Character limit adjustments
 * - Image resizing and optimization
 * - Hashtag formatting
 *
 * @param content - The raw content to process
 * @param platforms - Target platforms for publishing
 * @returns Processed content optimized for each platform
 * @throws {ValidationError} If content exceeds platform limits
 */
export async function processContent(
  content: ContentItem,
  platforms: Platform[]
): Promise<ProcessedContent[]> {
  // Implementation
}
```

### README Updates

- Keep README.md current with setup instructions
- Document all environment variables
- Update feature list when adding functionality
- Include troubleshooting for common issues

## Project-Specific Context

### Business Domain

- **Content Types:** Blog posts, social media posts, images, marketing materials
- **Platforms:** Facebook, Instagram, LinkedIn, Twitter, custom platforms
- **Workflows:** Draft → Review → Approval → Schedule → Publish
- **AI Features:** Text summarization, image generation, content optimization

### Key Constraints

- **Performance:** API responses should be < 2s
- **Security:** OWASP Top 10 compliance required
- **Accessibility:** WCAG 2.1 AA target
- **Browser Support:** Modern browsers (last 2 versions)
- **Mobile:** Responsive design required

### Known Issues & TODOs

- Test suite at 66% pass rate (13 failures are mocking issues)
- Production monitoring not yet configured
- Design system needs formalization
- WCAG compliance gaps exist
- In-memory rate limiting (consider Redis for multi-instance)

## Resources

### Documentation

- **README.md** - Setup and quick start
- **CONTRIBUTING.md** - Development guidelines
- **SECURITY.md** - Security policy
- **PROJECT_STRUCTURE.md** - Architecture overview
- **COMPREHENSIVE_ANALYSIS.md** - Technical analysis
- **docs/api-migration.md** - API migration guide
- **docs/best-practices.md** - Best practices guide

### Helpful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run type-check       # TypeScript check

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

## 🔄 Development Workflow

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates
- `chore/description` - Maintenance tasks

### Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Examples:**

```
feat(api): add content summarization endpoint
fix(auth): resolve token expiration issue
docs(readme): update installation instructions
test(api): add tests for parse endpoint
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes following coding standards
3. Write/update tests
4. Run `pnpm check-all` to verify quality
5. Commit with clear messages
6. Push and create PR
7. Address review feedback

### Before Submitting PR

Run the complete check:

```bash
pnpm check-all
```

This runs: type-check → lint → format:check → test

## 🐛 Troubleshooting

### Common Issues

**TypeScript Errors**

```bash
# Clear Next.js cache
rm -rf .next
pnpm type-check
```

**Test Failures**

```bash
# Clear Jest cache
pnpm test --clearCache
pnpm test
```

**Missing Environment Variables**

- Ensure `.env.local` exists (copy from `.env.example`)
- Required: `JWT_SECRET`
- Optional: Airtable, Hugging Face, notification services

**Port Already in Use**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
pnpm dev
```

**Module Not Found Errors**

```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📝 Common Tasks

### Adding a New API Route

1. **Create route file:**

   ```typescript
   // app/api/my-feature/route.ts
   import { withRateLimit, RateLimitPresets } from '@/app/api/_utils/rateLimit';
   import { validateAndSanitize, textInputSchema } from '@/app/api/_utils/sanitize';
   import { isAuthenticated } from '@/app/api/_utils/auth';
   import { Errors, withErrorHandling } from '@/app/api/_utils/errors';

   export const POST = withRateLimit(
     withErrorHandling(async (request: Request) => {
       if (!(await isAuthenticated())) {
         return Errors.unauthorized();
       }

       const body = await request.json();
       const validation = validateAndSanitize(textInputSchema, body);

       if (!validation.success) {
         return Errors.badRequest('Invalid input');
       }

       // Your logic here
       return Response.json({ success: true });
     }),
     '/api/my-feature',
     RateLimitPresets.GENERAL
   );
   ```

2. **Add tests:**

   ```typescript
   // __tests__/api/my-feature.test.ts
   import { POST } from '@/app/api/my-feature/route';

   describe('POST /api/my-feature', () => {
     it('should require authentication', async () => {
       // Test implementation
     });
   });
   ```

3. **Update documentation** if needed

### Adding a New Component

1. **Create component:**

   ```typescript
   // components/features/MyComponent.tsx
   import React from 'react';
   import styles from './MyComponent.module.css';

   interface MyComponentProps {
     title: string;
     onAction: () => void;
   }

   export function MyComponent({ title, onAction }: MyComponentProps) {
     return (
       <div className={styles.container}>
         <h2>{title}</h2>
         <button onClick={onAction} aria-label="Perform action">
           Action
         </button>
       </div>
     );
   }
   ```

2. **Create styles:**

   ```css
   /* components/features/MyComponent.module.css */
   .container {
     padding: 1rem;
   }
   ```

3. **Add tests:**

   ```typescript
   // __tests__/components/MyComponent.test.tsx
   import { render, screen } from '@testing-library/react';
   import { MyComponent } from '@/components/features/MyComponent';

   describe('MyComponent', () => {
     it('renders correctly', () => {
       render(<MyComponent title="Test" onAction={() => {}} />);
       expect(screen.getByText('Test')).toBeInTheDocument();
     });
   });
   ```

### Adding a New Utility Function

1. **Create utility:**

   ```typescript
   // lib/utils/myUtil.ts
   /**
    * Description of what this function does
    * @param input - Description of parameter
    * @returns Description of return value
    */
   export function myUtil(input: string): string {
     // Implementation
     return input.trim();
   }
   ```

2. **Add tests:**

   ```typescript
   // __tests__/lib/utils/myUtil.test.ts
   import { myUtil } from '@/lib/utils/myUtil';

   describe('myUtil', () => {
     it('should trim input', () => {
       expect(myUtil('  test  ')).toBe('test');
     });
   });
   ```

## When in Doubt

1. **Security First:** If unsure, add more security checks rather than fewer
2. **Follow Existing Patterns:** Look at similar files for guidance
3. **Test Everything:** Write tests before marking code complete
4. **Ask Questions:** Use comments to clarify unclear requirements
5. **Document Decisions:** Add comments explaining non-obvious choices
6. **Check Documentation:** Review README.md, CONTRIBUTING.md, and docs/ folder
7. **Run Quality Checks:** Always run `pnpm check-all` before committing

## 📚 Additional Resources

- **Repository:** [GitHub](https://github.com/phoenixvc/omnipost)
- **Documentation Hub:** [docs/README.md](../docs/README.md)
- **Architecture Guide:** [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- **API Best Practices:** [docs/api/next-api-best-practices.md](../docs/api/next-api-best-practices.md)
- **Contributing Guide:** [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Security Policy:** [SECURITY.md](../SECURITY.md)

---

**Last Updated:** March 30, 2026
**Maintained By:** Development Team
**Questions?** See CONTRIBUTING.md or create an issue
**Live Demo:** https://nl-dev-omnipost-app.azurewebsites.net

---

## Agent Infrastructure

### Retort Configuration

Agent configurations are managed via `.agentkit/spec/` YAML files. See `CLAUDE.md` for the primary agent entry point, `AGENTS.md` for cross-agent discovery, and `AGENT_TEAMS.md` for team ownership.

### Marketing Skills (34 skills)

Marketing domain expertise is available in `.agents/skills/`. Each skill follows the Agent Skills Specification with YAML frontmatter and structured guidance.

**Categories:** Conversion Optimization (7), Content & Copywriting (5), SEO & Discovery (6), Strategic & Growth (11), Sales & Analytics (4)

**Foundational skill:** `product-marketing-context` — load `.agents/context/product-marketing-context.md` before using any marketing skill.

### Sluice AI Gateway

AI requests can be routed through the Sluice gateway for centralized cost tracking and model abstraction. Controlled via the `aiGateway` feature flag in `lib/featureFlags.ts`. See `lib/clients/sluice-gateway.ts` for the client and `infra/terraform/env/dev` for infrastructure.

### Agent Teams

| Team      | Scope                                                                                                                                        |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| backend   | `app/api/`, `lib/services/`, `lib/scheduler/`, `lib/config/`                                                                                 |
| frontend  | `app/(dashboard)/`, `app/(marketing)/`, `components/`, `hooks/`, `styles/`                                                                   |
| data      | `prisma/`, `lib/db/`                                                                                                                         |
| infra     | `infra/`, `scripts/`                                                                                                                         |
| devops    | `.github/workflows/`                                                                                                                         |
| testing   | `__tests__/`, `tests/`                                                                                                                       |
| security  | `lib/auth/`, `app/api/_utils/auth.ts`, `app/api/_utils/sanitize.ts`, `app/api/_utils/rateLimit.ts`                                           |
| docs      | `docs/`, `*.md`                                                                                                                              |
| quality   | ESLint, Prettier, TypeScript configs                                                                                                         |
| marketing | `.agents/skills/`, `app/api/leads/`, `app/api/forms/`, `app/api/sequences/`, `app/api/engagement-metrics/`, `lib/scoring/`, `lib/sequences/` |
