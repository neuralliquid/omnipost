# Security Technology Stack

> **Layer**: Security
> **Technologies**: JWT auth, Zod validation, DOMPurify, rate limiting, RBAC
> **Last Updated**: December 2025

---

## Overview

The Content Creation Platform implements a comprehensive security stack addressing authentication, authorization, input validation, rate limiting, and protection against common web vulnerabilities aligned with OWASP guidelines.

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    TRANSPORT LAYER                       │    │
│  │  • HTTPS (enforced via HSTS)                            │    │
│  │  • TLS 1.2+ minimum                                     │    │
│  │  • Security headers                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    RATE LIMITING                         │    │
│  │  • Per-endpoint limits                                  │    │
│  │  • IP-based tracking                                    │    │
│  │  • Preset configurations                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   AUTHENTICATION                         │    │
│  │  • JWT token validation                                 │    │
│  │  • Token blacklisting                                   │    │
│  │  • Expiration checking                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   AUTHORIZATION                          │    │
│  │  • Role-based access control (RBAC)                     │    │
│  │  • Route-level permissions                              │    │
│  │  • Admin privilege checks                               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              INPUT VALIDATION & SANITIZATION             │    │
│  │  • Zod schema validation                                │    │
│  │  • DOMPurify sanitization                               │    │
│  │  • URL validation                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    AUDIT LOGGING                         │    │
│  │  • Action tracking                                      │    │
│  │  • User attribution                                     │    │
│  │  • Sensitive data redaction                             │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication

### JWT Implementation

**Library:** `jsonwebtoken` (^9.0.2)

**Token Structure:**

```typescript
interface TokenPayload {
  id: string; // User ID
  username: string; // Username
  role: string; // 'admin' | 'user'
  iat: number; // Issued at (Unix timestamp)
  exp: number; // Expiration (Unix timestamp)
}
```

**Token Generation:**

```typescript
// lib/auth/auth-service.ts
public generateToken(user: User, expiresIn = '1h'): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
    },
    this.getJwtSecret(),
    { expiresIn }
  );
}
```

### Token Validation

**Location:** `middleware.ts`

```typescript
// Startup validation - fail fast
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required');
}

// Token verification
try {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

  // Expiration check
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp && decoded.exp < now) {
    return NextResponse.json({ message: 'Token has expired' }, { status: 401 });
  }
} catch (error) {
  return NextResponse.json({ message: 'Invalid authentication token' }, { status: 401 });
}
```

### Token Sources

| Source                | Priority | Usage            |
| --------------------- | -------- | ---------------- |
| Cookie (`auth-token`) | 1st      | Browser requests |
| Authorization header  | 2nd      | API clients      |

### Token Blacklisting

```typescript
// In-memory blacklist
const tokenBlacklist = new Map<string, number>();

// Add on logout
addToTokenBlacklist(token: string, expiryTime: number): void {
  tokenBlacklist.set(token, Date.now() + expiryTime * 1000);
}

// Check before validation
isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}
```

---

## Authorization (RBAC)

### Role Definitions

| Role    | Capabilities                  |
| ------- | ----------------------------- |
| `user`  | Standard API access           |
| `admin` | User access + admin endpoints |

### Protected Routes

**Authenticated Routes:**

```typescript
const authenticatedPaths = [
  '/api/platforms',
  '/api/queue',
  '/api/images',
  '/api/parse',
  '/api/summarize',
  '/api/content',
  '/api/feedback',
  '/api/notifications',
];
```

**Admin Routes:**

```typescript
const adminPaths = ['/api/feature-flags', '/api/audit'];
```

### Middleware Enforcement

```typescript
// Admin check in middleware
if (requiresAdmin) {
  const isAdmin = decoded.role === 'admin';
  if (!isAdmin) {
    return NextResponse.json({ message: 'Admin privileges required' }, { status: 403 });
  }
}
```

---

## Rate Limiting

### Implementation

**Location:** `/app/api/_utils/rateLimit.ts`

```typescript
interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
  message?: string; // Custom error message
}

// IP extraction (proxy-aware)
function getRateLimitKey(request: NextRequest, endpoint: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return `${endpoint}:${ip}`;
}
```

### Preset Configurations

| Preset       | Requests | Window | Use Case           |
| ------------ | -------- | ------ | ------------------ |
| `AUTH`       | 5        | 15 min | Login attempts     |
| `AI_SERVICE` | 10       | 1 min  | AI endpoints       |
| `GENERAL`    | 100      | 15 min | Standard endpoints |
| `ADMIN`      | 50       | 1 hour | Admin operations   |

### Response Headers

```typescript
// Success response headers
'X-RateLimit-Limit': maxRequests.toString()
'X-RateLimit-Remaining': remaining.toString()
'X-RateLimit-Reset': resetTime.toString()

// Rate limit exceeded (429)
'Retry-After': retryAfter.toString()
```

---

## Input Validation

### Zod Schemas

**Location:** `/app/api/_utils/sanitize.ts`

```typescript
// Text input validation
export const textInputSchema = z.object({
  rawInput: z
    .string()
    .min(1, 'Input cannot be empty')
    .max(1_000_000, 'Input too large (max 1MB)')
    .transform(val => sanitizeText(val)),
});

// Image context validation
export const imageContextSchema = z.object({
  context: z
    .string()
    .min(1, 'Context cannot be empty')
    .max(10_000, 'Context too large')
    .transform(val => sanitizeText(val)),
});

// Feedback validation
export const feedbackSchema = z.object({
  message: z.string().min(1).max(5_000).transform(sanitizeText),
  rating: z.number().int().min(1).max(5).optional(),
  category: z.enum(['bug', 'feature', 'improvement', 'other']).optional(),
});

// Notification validation
export const notificationSchema = z.object({
  message: z.string().min(1).max(10_000).transform(sanitizeText),
  type: z.enum(['email', 'slack', 'sms']),
  recipient: z.string().email().optional().or(z.string().min(1)),
});
```

### Validation Helper

```typescript
export function validateAndSanitize<T extends z.ZodType>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}
```

---

## Input Sanitization

### XSS Prevention

**Library:** `isomorphic-dompurify` (^2.33.0)

```typescript
// Strip all HTML
export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

// Allow specific HTML
export function sanitizeHtml(
  input: string,
  options?: {
    allowedTags?: string[];
    allowedAttributes?: string[];
  }
): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: options?.allowedTags || [],
    ALLOWED_ATTR: options?.allowedAttributes || [],
    KEEP_CONTENT: true,
  });
}
```

### SSRF Prevention

```typescript
export function sanitizeUrl(url: string, allowedDomains?: string[]): string | null {
  try {
    const parsed = new URL(url);

    // Protocol whitelist
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    // Domain whitelist (if provided)
    if (allowedDomains?.length) {
      const isAllowed = allowedDomains.some(
        domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
      if (!isAllowed) return null;
    }

    // Block private IPs
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname.startsWith('127.') ||
      parsed.hostname.startsWith('192.168.') ||
      parsed.hostname.startsWith('10.') ||
      parsed.hostname.startsWith('172.16.')
    ) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}
```

---

## Security Headers

### Configuration

**Location:** `next.config.ts`

```typescript
async headers() {
  return [{
    source: '/:path*',
    headers: [
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy', value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "frame-ancestors 'self'",
      ].join('; ') },
    ],
  }];
}
```

### Header Details

| Header                      | Value                    | Protection            |
| --------------------------- | ------------------------ | --------------------- |
| `Strict-Transport-Security` | 2 year max-age, preload  | Force HTTPS           |
| `X-Frame-Options`           | SAMEORIGIN               | Clickjacking          |
| `X-Content-Type-Options`    | nosniff                  | MIME sniffing         |
| `X-XSS-Protection`          | 1; mode=block            | XSS (legacy browsers) |
| `Content-Security-Policy`   | Restrictive              | XSS, injection        |
| `Permissions-Policy`        | Disabled APIs            | Feature abuse         |
| `Referrer-Policy`           | origin-when-cross-origin | Information leakage   |

---

## Audit Logging

### Implementation

**Location:** `/app/api/_utils/audit.ts`

```typescript
interface AuditLogEntry {
  action: string;
  user: string;
  timestamp: string;
  path: string;
  method: string;
  body?: object;
}

export function auditLog(
  action: string,
  userId: string,
  context?: { path?: string; method?: string; body?: object }
): void {
  const entry: AuditLogEntry = {
    action,
    user: userId,
    timestamp: new Date().toISOString(),
    path: context?.path || 'unknown',
    method: context?.method || 'unknown',
  };

  // Sanitize body before logging
  if (context?.body) {
    entry.body = sanitizeLogBody(context.body);
  }

  console.log('[AUDIT]', JSON.stringify(entry));
}
```

### Logged Actions

| Category       | Actions                                            |
| -------------- | -------------------------------------------------- |
| Authentication | LOGIN_ATTEMPT, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT |
| Feature Flags  | GET_FEATURE_FLAGS, UPDATE_FEATURE_FLAG             |
| Content        | GENERATE_IMAGE, REVIEW_IMAGE, STORE_CONTENT        |
| Platform       | GET_PLATFORMS_LIST, GET_PLATFORM_CAPABILITIES      |

### Sensitive Data Redaction

```typescript
function sanitizeLogBody(body: object): object {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'key'];
  const sanitized = { ...body };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}
```

---

## OWASP Compliance

| Risk                               | Mitigation                     | Status |
| ---------------------------------- | ------------------------------ | ------ |
| **A01: Broken Access Control**     | RBAC, middleware checks        | ✅     |
| **A02: Cryptographic Failures**    | JWT signing, env secrets       | ⚠️     |
| **A03: Injection**                 | Zod + DOMPurify                | ✅     |
| **A04: Insecure Design**           | Security headers, CSP          | ✅     |
| **A05: Security Misconfiguration** | Fail-fast validation           | ✅     |
| **A06: Vulnerable Components**     | npm audit clean                | ✅     |
| **A07: Auth Failures**             | Rate limiting, token blacklist | ✅     |
| **A08: Software Integrity**        | npm ci                         | ⚠️     |
| **A09: Logging Failures**          | Audit logging                  | ⚠️     |
| **A10: SSRF**                      | URL sanitization               | ✅     |

---

## Security Checklist

### Implemented

- [x] JWT-based authentication
- [x] Token expiration validation
- [x] Token blacklisting
- [x] Role-based access control
- [x] Rate limiting (all endpoints)
- [x] Input validation (Zod)
- [x] XSS prevention (DOMPurify)
- [x] SSRF prevention (URL validation)
- [x] Security headers (comprehensive)
- [x] Audit logging
- [x] Fail-fast secret validation
- [x] Sensitive data redaction

### Needs Improvement

- [ ] Password hashing (currently mock auth)
- [ ] Centralized logging service
- [ ] Secrets management (Key Vault)
- [ ] CSRF protection tokens
- [ ] API key rotation
- [ ] Security monitoring/alerting

---

## Recommendations

### Short-term

1. Implement bcrypt for password hashing
2. Add CSRF protection for state-changing requests
3. Move secrets to Azure Key Vault

### Medium-term

1. Add security monitoring/alerting
2. Implement centralized logging
3. Add penetration testing

### Long-term

1. Consider WAF (Web Application Firewall)
2. Implement threat detection
3. Add security compliance reporting

---

_This document details the security technology stack for the Content Creation Platform._
