# Backend Team Rules

**Scope:** `app/api/**`, `lib/services/**`, `lib/scheduler/**`, `lib/config/**`

Server-side API routes, business logic services, scheduling, and configuration.

## API Route Standards

- Use App Router (`app/api/`) for all new routes. Never add routes to `pages/api/`.
- All route handlers must be async.
- Follow RESTful conventions: GET, POST, PUT, DELETE.
- Use descriptive route paths: `/api/content/[id]/publish`.

## Security (Mandatory)

- ALWAYS use `await isAuthenticated()` -- it is async. Missing await bypasses auth.
- ALWAYS validate input with Zod schemas before processing.
- ALWAYS sanitize user input with DOMPurify via `app/api/_utils/sanitize.ts`.
- ALWAYS apply rate limiting using `withRateLimit` wrapper from `app/api/_utils/rateLimit.ts`.
- NEVER expose stack traces in production responses.

## Error Handling

- Use consistent error format: `{ error: string, details?: string, code?: string }`.
- Use consistent success format: `{ success: boolean, data: object, message?: string }`.
- Return proper HTTP status codes: 200/201 success, 400 bad input, 401 unauthorized, 404 not found, 500 server error.
- Wrap handlers with `withErrorHandling` for consistent error responses.

## TypeScript

- Strict mode enforced. No `any` types.
- Define explicit types for function parameters and return values.
- Use interfaces for object shapes, types for unions/primitives.

## Testing Requirements

- Unit test validation logic and business logic separately.
- Integration test with auth middleware (mock JWT).
- Mock external services (Prisma, AI providers).
- Test all error paths (401, 400, 404, 500).
- Target 80%+ coverage per route file.

## Database

- Use Prisma `select()` to avoid fetching unnecessary fields.
- Use `include()` for relations instead of separate queries.
- Verify no N+1 queries with `PrismaClient({ log: ['query'] })`.
- Wrap multi-step operations in `prisma.$transaction()`.

## Pattern Reference

```typescript
import { withRateLimit, RateLimitPresets } from '@/app/api/_utils/rateLimit';
import { withErrorHandling } from '@/app/api/_utils/errors';
import { Errors } from '@/app/api/_utils/errors';
import { validateAndSanitize } from '@/app/api/_utils/sanitize';
import { isAuthenticated } from '@/app/api/_utils/auth';

export const POST = withRateLimit(
  withErrorHandling(async (request: Request) => {
    if (!(await isAuthenticated())) {
      return Errors.unauthorized('Authentication required');
    }
    const body = await request.json();
    const validation = validateAndSanitize(schema, body);
    if (!validation.success) {
      return Errors.badRequest('Invalid input: ' + validation.errors.join(', '));
    }
    const result = await processData(validation.data);
    return Response.json({ success: true, data: result }, { status: 201 });
  }),
  '/api/route-path',
  RateLimitPresets.GENERAL
);
```
