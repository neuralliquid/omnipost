# Testing Technology Stack

> **Layer**: Testing & QA
> **Technologies**: Jest 29+, React Testing Library, ts-jest
> **Last Updated**: December 2025

---

## Overview

The OmniPost uses Jest as the primary test framework with React Testing Library for component testing and ts-jest for TypeScript support. The test suite focuses on API route testing and unit tests.

---

## Test Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                      TEST PYRAMID                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                        ┌───────────┐                            │
│                        │   E2E     │  ← Not implemented         │
│                        │  Tests    │                            │
│                        └───────────┘                            │
│                    ┌─────────────────┐                          │
│                    │   Integration   │  ← Partial (1 skipped)   │
│                    │     Tests       │                          │
│                    └─────────────────┘                          │
│               ┌───────────────────────────┐                     │
│               │       API Route Tests      │  ← Implemented     │
│               │   (auth, images, flags)    │                    │
│               └───────────────────────────┘                     │
│          ┌─────────────────────────────────────┐                │
│          │            Unit Tests               │  ← Implemented │
│          │      (api-client, utilities)        │                │
│          └─────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Technologies

### Jest

| Aspect            | Details                |
| ----------------- | ---------------------- |
| **Version**       | ^29.7.0                |
| **Environment**   | jest-environment-jsdom |
| **Configuration** | `jest.config.js`       |
| **Setup**         | `jest.setup.js`        |

### React Testing Library

| Package                     | Version | Purpose           |
| --------------------------- | ------- | ----------------- |
| `@testing-library/react`    | ^16.3.0 | Component testing |
| `@testing-library/jest-dom` | ^6.6.3  | DOM matchers      |

### TypeScript Support

| Package       | Version  | Purpose                |
| ------------- | -------- | ---------------------- |
| `ts-jest`     | ^29.3.2  | TypeScript transformer |
| `@types/jest` | ^29.5.14 | Type definitions       |

---

## Configuration

### Jest Configuration

**Location:** `jest.config.js`

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
  },

  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },

  transformIgnorePatterns: ['node_modules/(?!(node-fetch)/)'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],

  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],

  verbose: true,
};

module.exports = createJestConfig(customJestConfig);
```

### TypeScript Configuration for Tests

**Location:** `tsconfig.jest.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

---

## Test Setup

### Global Setup

**Location:** `jest.setup.js`

```javascript
import '@testing-library/jest-dom';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';

// Mock fetch API
global.fetch = jest.fn();

// Mock Next.js modules
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((body, init) => ({
      json: async () => body,
      status: init?.status || 200,
      headers: new Map(),
    })),
  },
}));

// Mock cookies and headers
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(),
  })),
}));
```

---

## Test Organization

### Directory Structure

```text
__tests__/
├── api/                    # API route tests
│   ├── auth.test.ts        # Authentication tests
│   ├── feature-flags.test.ts
│   ├── images.test.ts
│   └── platforms.test.ts
├── integration/            # Integration tests
│   └── api-flow.test.ts    # (skipped - ESM issue)
├── lib/                    # Unit tests
│   └── api-client.test.js
├── basic.test.js           # Sanity tests
└── setup.ts                # Setup verification
```

### Test Files Summary

| File                    | Tests | Status     |
| ----------------------- | ----- | ---------- |
| `basic.test.js`         | 2     | ✅ Passing |
| `setup.ts`              | 1     | ✅ Passing |
| `api-client.test.js`    | 6     | ✅ Passing |
| `auth.test.ts`          | 6     | ✅ Passing |
| `feature-flags.test.ts` | 7     | ✅ Passing |
| `images.test.ts`        | 9     | ✅ Passing |
| `platforms.test.ts`     | 7     | ✅ Passing |
| `api-flow.test.ts`      | 1     | ⏭️ Skipped |

**Total:** 39 tests (38 passing, 1 skipped)

---

## Test Types

### Unit Tests

**Example:** `__tests__/lib/api-client.test.js`

```javascript
describe('API Client', () => {
  it('getPlatforms should fetch platforms from the API', async () => {
    const mockPlatforms = [{ id: 1, name: 'Facebook' }];
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlatforms,
    });

    const result = await getPlatforms();
    expect(result).toEqual(mockPlatforms);
    expect(fetch).toHaveBeenCalledWith('/api/platforms', expect.any(Object));
  });
});
```

### API Route Tests

**Example:** `__tests__/api/auth.test.ts`

```typescript
describe('Auth API', () => {
  describe('POST /api/auth (login)', () => {
    it('should authenticate a user with valid credentials', async () => {
      const mockRequest = createMockRequest({
        method: 'POST',
        body: { username: 'admin', password: 'admin123' },
      });

      const response = await POST(mockRequest);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.token).toBeDefined();
      expect(body.user.username).toBe('admin');
    });

    it('should reject invalid credentials', async () => {
      const mockRequest = createMockRequest({
        method: 'POST',
        body: { username: 'admin', password: 'wrong' },
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(401);
    });
  });
});
```

### Integration Tests

**Example:** `__tests__/integration/api-flow.test.ts`

```typescript
// Currently skipped due to ESM import issues with node-fetch
describe.skip('API Integration Flow', () => {
  it('should complete full content creation workflow', async () => {
    // 1. Login
    // 2. Parse content
    // 3. Generate summary
    // 4. Generate image
    // 5. Store content
  });
});
```

---

## Mocking Strategies

### Next.js Mocks

```typescript
// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body, init) => ({
      json: async () => body,
      status: init?.status || 200,
    }),
  },
}));

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: () => ({ get: jest.fn(), set: jest.fn() }),
  headers: () => ({ get: jest.fn() }),
}));
```

### Feature Flags Mock

```typescript
jest.mock('@/lib/featureFlags', () => ({
  default: {
    imageGeneration: { enabled: true, implementation: 'huggingface' },
    textParser: { enabled: true, implementation: 'openai' },
    summarization: { enabled: true, implementation: 'huggingface' },
    platformConnectors: true,
    multiPlatformPublishing: true,
    notificationSystem: true,
    feedbackMechanism: true,
    airtableIntegration: true,
  },
  loadFeatureFlags: jest.fn(),
  saveFeatureFlags: jest.fn(),
}));
```

### External Service Mocks

```typescript
// Hugging Face client mock
jest.mock('@/lib/clients/huggingface', () => ({
  HuggingFaceClient: jest.fn().mockImplementation(() => ({
    generateImage: jest.fn().mockResolvedValue({
      id: '123',
      url: 'https://example.com/image.jpg',
    }),
    approveImage: jest.fn(),
    rejectImage: jest.fn(),
  })),
}));
```

---

## Test Utilities

### Mock Request Helper

```typescript
function createMockRequest(options: {
  method?: string;
  body?: object;
  headers?: Record<string, string>;
}): NextRequest {
  return {
    method: options.method || 'GET',
    json: async () => options.body || {},
    headers: new Map(Object.entries(options.headers || {})),
    cookies: { get: jest.fn() },
    nextUrl: { pathname: '/api/test' },
  } as unknown as NextRequest;
}
```

### Auth Helper

```typescript
function createAuthenticatedRequest(body?: object): NextRequest {
  return createMockRequest({
    method: 'POST',
    body,
    headers: {
      'x-user-id': '1',
      'x-user-role': 'admin',
      'x-user-name': 'admin',
    },
  });
}
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- __tests__/api/auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

### CI Integration

**Location:** `.github/workflows/ci.yml`

```yaml
- name: Run tests
  run: npm test
  env:
    JWT_SECRET: test-secret-key-for-ci
```

---

## Coverage

### Configuration

```javascript
collectCoverageFrom: [
  'app/**/*.{js,jsx,ts,tsx}',
  'components/**/*.{js,jsx,ts,tsx}',
  'lib/**/*.{js,jsx,ts,tsx}',
  '!**/*.d.ts',
  '!**/node_modules/**',
],
```

### Current Status

| Metric     | Target | Current |
| ---------- | ------ | ------- |
| Overall    | 70%    | ~47%    |
| API Routes | 80%    | ~60%    |
| Components | 70%    | Low     |
| Libraries  | 70%    | ~50%    |

### Running Coverage

```bash
npm run test:coverage
```

---

## Test Patterns

### AAA Pattern (Arrange-Act-Assert)

```typescript
it('should do something', async () => {
  // Arrange
  const mockData = { id: 1, name: 'test' };
  mockService.getData.mockResolvedValue(mockData);

  // Act
  const result = await functionUnderTest();

  // Assert
  expect(result).toEqual(mockData);
  expect(mockService.getData).toHaveBeenCalled();
});
```

### Testing Error Cases

```typescript
it('should handle errors gracefully', async () => {
  // Arrange
  mockService.getData.mockRejectedValue(new Error('Network error'));

  // Act
  const response = await handler(mockRequest);

  // Assert
  expect(response.status).toBe(500);
  const body = await response.json();
  expect(body.message).toContain('error');
});
```

### Testing Validation

```typescript
it('should validate required fields', async () => {
  const mockRequest = createMockRequest({
    method: 'POST',
    body: {}, // Missing required fields
  });

  const response = await handler(mockRequest);

  expect(response.status).toBe(400);
  const body = await response.json();
  expect(body.details).toBeDefined();
});
```

---

## Known Issues

### ESM Import Issue

**File:** `__tests__/integration/api-flow.test.ts`

```typescript
// TODO: Fix node-fetch ESM import issue
// The test is currently skipped due to Jest's
// handling of ES modules
describe.skip('API Integration Flow', () => { ... });
```

**Workaround:** Using global fetch mock instead of node-fetch

---

## Missing Tests

### Not Yet Implemented

| Category            | Priority | Notes                     |
| ------------------- | -------- | ------------------------- |
| E2E tests           | High     | No Playwright/Cypress     |
| Component tests     | Medium   | RTL configured but unused |
| Visual regression   | Low      | No Chromatic/Percy        |
| Accessibility tests | Medium   | No jest-axe               |
| Performance tests   | Low      | No benchmarking           |

### Test Debt

- [ ] Component unit tests
- [ ] Integration tests (fix ESM issue)
- [ ] E2E critical path tests
- [ ] Accessibility testing setup
- [ ] Snapshot tests for UI

---

## Best Practices Compliance

| Practice                          | Status | Notes                       |
| --------------------------------- | ------ | --------------------------- |
| Test behavior, not implementation | ✅     | API tests focus on outcomes |
| Mock external services            | ✅     | Configured in setup         |
| Isolated tests                    | ✅     | No test interdependence     |
| Fast execution                    | ✅     | ~9 seconds for suite        |
| Meaningful assertions             | ✅     | Clear expectations          |
| Error case coverage               | ✅     | Error scenarios tested      |
| Coverage thresholds               | ❌     | Below 70% target            |
| E2E tests                         | ❌     | Not implemented             |

---

## Recommendations

### Short-term

1. Increase coverage to 70% minimum
2. Add component tests with RTL
3. Fix ESM integration test issue

### Medium-term

1. Add E2E tests with Playwright
2. Implement jest-axe for accessibility
3. Add performance benchmarks

### Long-term

1. Visual regression testing
2. Contract testing for APIs
3. Chaos engineering tests

---

_This document details the testing technology stack for the OmniPost._
