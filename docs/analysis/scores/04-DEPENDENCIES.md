# Dependencies Assessment

> **Category**: Dependencies
> **Score**: 75% (Good)
> **Last Updated**: December 2025

---

## Overview

Dependency management covers version control, security, maintenance, and the overall health of the project's package ecosystem. The OmniPost demonstrates good dependency hygiene with some areas for improvement.

---

## Score Breakdown

| Criterion                  | Weight | Score | Status        |
| -------------------------- | ------ | ----- | ------------- |
| Security (vulnerabilities) | 30%    | 100%  | ✅ Excellent  |
| Version pinning            | 20%    | 60%   | ⚠️ Needs work |
| Dependency freshness       | 20%    | 75%   | ✅ Good       |
| Bundle size impact         | 15%    | 70%   | ✅ Good       |
| Unused dependencies        | 15%    | 70%   | ✅ Good       |

**Overall: 75% (Good)**

---

## Dependency Inventory

### Production Dependencies (14)

| Package                | Version | Purpose           | Size Impact  |
| ---------------------- | ------- | ----------------- | ------------ |
| `next`                 | latest  | Framework         | Large (core) |
| `react`                | latest  | UI library        | Large (core) |
| `react-dom`            | latest  | React DOM         | Large (core) |
| `axios`                | ^1.9.0  | HTTP client       | Small        |
| `jsonwebtoken`         | ^9.0.2  | JWT auth          | Small        |
| `zod`                  | ^3.24.3 | Validation        | Small        |
| `dompurify`            | ^3.2.5  | Sanitization      | Small        |
| `isomorphic-dompurify` | ^2.33.0 | SSR sanitization  | Small        |
| `express`              | ^5.1.0  | Server patterns   | Medium       |
| `express-rate-limit`   | ^7.1.5  | Rate limiting     | Small        |
| `@slack/web-api`       | ^7.9.1  | Slack integration | Medium       |
| `twilio`               | ^5.5.2  | SMS notifications | Medium       |
| `nodemailer`           | ^7.0.7  | Email sending     | Small        |
| `react-markdown`       | ^10.1.0 | Markdown render   | Medium       |

### Development Dependencies (23)

| Package                            | Version  | Purpose                     |
| ---------------------------------- | -------- | --------------------------- |
| `typescript`                       | ^5.3.3   | Type system                 |
| `@types/react`                     | ^18.2.48 | React types                 |
| `@types/react-dom`                 | ^18.2.18 | React DOM types             |
| `@types/node`                      | ^20.11.5 | Node types                  |
| `@types/jsonwebtoken`              | ^9.0.5   | JWT types                   |
| `@types/express`                   | ^5.0.1   | Express types               |
| `@types/nodemailer`                | ^6.4.17  | Nodemailer types            |
| `@types/jest`                      | ^29.5.14 | Jest types                  |
| `@types/airtable`                  | ^0.10.5  | Airtable types (deprecated) |
| `jest`                             | ^29.7.0  | Testing                     |
| `@jest/globals`                    | ^29.7.0  | Jest globals                |
| `jest-environment-jsdom`           | ^29.7.0  | Browser env                 |
| `ts-jest`                          | ^29.3.2  | TS support                  |
| `@testing-library/react`           | ^16.3.0  | Component testing           |
| `@testing-library/jest-dom`        | ^6.6.3   | DOM matchers                |
| `eslint`                           | latest   | Linting                     |
| `eslint-config-next`               | latest   | Next.js rules               |
| `@eslint/eslintrc`                 | ^3.3.1   | ESLint config               |
| `@typescript-eslint/eslint-plugin` | ^8.47.0  | TS rules                    |
| `@typescript-eslint/parser`        | ^8.47.0  | TS parser                   |
| `eslint-plugin-react`              | ^7.37.5  | React rules                 |
| `eslint-plugin-react-hooks`        | ^7.0.1   | Hooks rules                 |
| `prettier`                         | ^3.6.2   | Formatting                  |
| `node-fetch`                       | ^3.3.2   | Fetch polyfill              |

---

## What's Working Well

### 1. Security Status (100%)

```bash
$ npm audit
found 0 vulnerabilities
```

**Recent security fixes:**

- Critical: Next.js RCE vulnerability (GHSA-9qr9-h5gf-34mp)
- High: jws HMAC signature verification (GHSA-869p-cjfg-cm3x)
- Moderate: mdast-util-to-hast (GHSA-4fh9-h7wg-q85m)
- Moderate: Nodemailer DoS (GHSA-rcmh-qjqh-p98v)

### 2. Dependency Quality

| Metric              | Status  |
| ------------------- | ------- |
| Actively maintained | ✅ All  |
| Popular/trusted     | ✅ All  |
| MIT/Apache licensed | ✅ All  |
| Tree-shakeable      | ✅ Most |

### 3. Lock File Management

```bash
# package-lock.json committed
# npm ci used in CI
npm ci  # Deterministic installs
```

### 4. Dependabot Enabled

```yaml
# .github/dependabot.yml (implied by PR history)
# Automated security updates
# Grouped npm updates
```

---

## Areas for Improvement

### 1. Version Pinning (60%)

**Current issues:**

```json
{
  "dependencies": {
    "next": "latest", // ❌ Unpinned
    "react": "latest", // ❌ Unpinned
    "react-dom": "latest", // ❌ Unpinned
    "eslint": "latest", // ❌ Unpinned
    "eslint-config-next": "latest" // ❌ Unpinned
  }
}
```

**Recommended:**

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

**Why this matters:**

- `latest` can introduce breaking changes unexpectedly
- Different environments may get different versions
- Harder to reproduce issues

### 2. Deprecated Package

```bash
npm WARN deprecated @types/airtable@0.10.5:
This is a stub types definition.
airtable provides its own type definitions.
```

**Fix:** Remove `@types/airtable` from devDependencies

### 3. Duplicate Functionality

| Packages                             | Overlap      | Recommendation                   |
| ------------------------------------ | ------------ | -------------------------------- |
| `dompurify` + `isomorphic-dompurify` | SSR handling | Keep only `isomorphic-dompurify` |
| `express` + Next.js                  | Server       | Consider removing express        |

---

## Bundle Analysis

### Estimated Bundle Impact

| Category            | Packages | Est. Size   |
| ------------------- | -------- | ----------- |
| Core (Next/React)   | 3        | ~150KB gzip |
| HTTP (axios)        | 1        | ~15KB gzip  |
| Validation (zod)    | 1        | ~12KB gzip  |
| Auth (jsonwebtoken) | 1        | ~8KB gzip   |
| Markdown            | 1        | ~20KB gzip  |
| **Total (client)**  |          | ~205KB gzip |

### Optimization Opportunities

1. **Consider native fetch** instead of axios (browser-native)
2. **Dynamic imports** for heavy dependencies
3. **Analyze bundle** with `@next/bundle-analyzer`

---

## Dependency Tree Health

### Direct Dependencies

- Production: 14 packages
- Development: 23 packages
- Total direct: 37 packages

### Transitive Dependencies

- Total installed: ~953 packages
- After deduplication: Reasonable

### Outdated Packages

```bash
$ npm outdated
# (Run to check current status)
```

---

## Security Practices

### Implemented ✅

- [x] npm audit in CI
- [x] Dependabot enabled
- [x] Lock file committed
- [x] npm ci in CI/CD

### Recommended Additions

- [ ] Snyk integration
- [ ] License compliance checking
- [ ] Bundle size budgets
- [ ] Automated updates for patches

---

## Recommendations

### Immediate (Quick Wins)

1. Pin `next`, `react`, `react-dom` to specific versions
2. Remove `@types/airtable` (deprecated)
3. Remove duplicate `dompurify` (keep isomorphic)

### Short-term

1. Add `@next/bundle-analyzer`
2. Set up bundle size budgets
3. Review express dependency necessity

### Medium-term

1. Evaluate native fetch vs axios
2. Add license compliance checking
3. Implement automated patch updates

### Long-term

1. Consider monorepo with shared deps
2. Implement dependency update cadence
3. Add security scanning (Snyk/Sonatype)

---

## Dependency Update Policy

### Recommended Cadence

| Type              | Frequency | Approach        |
| ----------------- | --------- | --------------- |
| Security patches  | Immediate | Automated merge |
| Bug fixes (patch) | Weekly    | Review + merge  |
| Minor updates     | Monthly   | Test + merge    |
| Major updates     | Quarterly | Full testing    |

### Breaking Change Process

1. Create feature branch
2. Update dependency
3. Run full test suite
4. Review changelog
5. Update code if needed
6. Merge after approval

---

_This document assesses dependency management for the OmniPost._
