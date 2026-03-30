# Testing Team Rules

**Scope:** `__tests__/**`, `tests/**`

Test suites, test utilities, fixtures, Jest configuration, and test infrastructure.

## Test Structure

- Place tests in `__tests__/` mirroring the source file structure.
- Use descriptive test names: `should return 401 when user is not authenticated`.
- Group related tests with `describe` blocks.
- Follow Arrange-Act-Assert pattern.

## Coverage Target

- Target 80% line, branch, and function coverage.
- Run `pnpm test:coverage` to generate coverage reports.

## What to Test

- Happy path and error cases for every function.
- Authentication and authorization checks.
- Input validation and sanitization.
- Edge cases and boundary conditions.
- Component rendering and user interactions.
- Accessibility with jest-axe.

## Mocking

- ALWAYS mock external services (Airtable, Slack, Twilio, Hugging Face).
- Use Jest mocks for modules and functions.
- Create shared mock utilities in test setup files.
- Never make real API calls in tests.

## Tools

- **Jest 29** -- Test runner and assertion library
- **React Testing Library** -- Component testing
- **jest-axe** -- Accessibility testing
- **ts-jest** -- TypeScript support

## Commands

```bash
pnpm test            # Run all tests
pnpm test:watch      # Watch mode for development
pnpm test:coverage   # Run with coverage reporting
```

## Test Pattern

```typescript
describe('POST /api/content/create', () => {
  it('should create content when authenticated and input is valid', async () => {
    // Arrange
    const mockContent = { title: 'Test', body: 'Content' };
    // Act
    const response = await createContent(mockContent);
    // Assert
    expect(response.status).toBe(201);
  });

  it('should return 401 when user is not authenticated', async () => {
    const response = await createContent({});
    expect(response.status).toBe(401);
  });
});
```
