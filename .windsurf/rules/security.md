# Security Team Rules

**Scope:** `lib/auth/**`, `app/api/_utils/auth.ts`, `app/api/_utils/sanitize.ts`, `app/api/_utils/rateLimit.ts`

Authentication, authorization, input sanitization, rate limiting, and security middleware.

## Authentication

- ALWAYS use `await isAuthenticated()` -- it is async. Missing `await` is a critical security bypass.
- Return 401 for all unauthenticated requests.
- Validate JWT tokens properly with expiration checks.
- Never store sensitive data in JWT payload.

## Input Sanitization

- ALWAYS sanitize user input using DOMPurify via `app/api/_utils/sanitize.ts`.
- ALWAYS validate with Zod schemas before processing any user-supplied data.
- Never trust user input or insert it directly into HTML or database queries.
- Use `validateAndSanitize()` helper for combined validation and sanitization.

## Rate Limiting

- ALWAYS apply rate limiting to public and protected endpoints.
- Use `withRateLimit` wrapper from `app/api/_utils/rateLimit.ts`.
- Presets:
  - `RateLimitPresets.AUTH` -- 5 requests per 15 minutes (login, register)
  - `RateLimitPresets.GENERAL` -- Standard API rate limit
  - `RateLimitPresets.AI` -- 10 requests per minute (AI/expensive endpoints)

## Error Handling

- NEVER expose stack traces or internal error details in production.
- Log errors server-side for debugging but sanitize log output.
- Return generic error messages to clients.

## Environment Variables

- NEVER commit secrets or API keys.
- ALWAYS validate required environment variables at startup.
- Use `.env.local` for local development.
- Use Azure Key Vault for production secrets.

## OWASP Compliance

- Protect against XSS via DOMPurify sanitization.
- Protect against injection via Zod validation and Prisma parameterized queries.
- Protect against CSRF via token validation.
- Protect against brute force via rate limiting.
- Implement security headers in middleware.
