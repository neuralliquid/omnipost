# Contributing to Content Creation Platform

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [API Development Guidelines](#api-development-guidelines)

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm package manager
- Git

### Development Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/JustAGhosT/content_creation.git
   cd content_creation
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the root directory with the required environment variables:

   ```bash
   # Authentication
   JWT_SECRET=your-jwt-secret

   # Airtable (if using)
   AIRTABLE_API_KEY=your-airtable-api-key
   AIRTABLE_BASE_ID=your-base-id
   AIRTABLE_TABLE_NAME=your-table-name

   # Hugging Face API (for image generation)
   HUGGING_FACE_API_KEY=your-hugging-face-api-key

   # Email notifications (optional)
   EMAIL_USER=your-email
   GMAIL_CLIENT_ID=your-client-id
   GMAIL_CLIENT_SECRET=your-client-secret
   GMAIL_REFRESH_TOKEN=your-refresh-token

   # Slack notifications (optional)
   SLACK_TOKEN=your-slack-token

   # Twilio (optional)
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=your-phone-number
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for a detailed overview of the project's directory structure.

**Key Points:**

- New API routes go in `/app/api/`
- React components are organized by feature in `/components/`
- Business logic belongs in `/lib/`
- Types are centralized in `/types/`
- Tests mirror the source structure in `/__tests__/`

## Coding Standards

### TypeScript

- **Always use TypeScript** for new files
- Define proper types/interfaces (avoid `any` when possible)
- Export types from `/types/` directory for reusability
- Use type inference where appropriate

### Component Structure

```typescript
import React from 'react';
import styles from './MyComponent.module.css';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onAction }) => {
  return (
    <div className={styles.container}>
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
};

export default MyComponent;
```

### Naming Conventions

- **Files**:
  - Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
  - Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
  - CSS Modules: `PascalCase.module.css` or `kebab-case.module.css`
- **Variables/Functions**: `camelCase`
- **Components**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### Code Style

- Use **functional components** with hooks
- Prefer **const** over **let** when possible
- Use **arrow functions** for consistency
- Keep functions small and focused (single responsibility)
- Add comments for complex logic
- Use meaningful variable names

### CSS Modules

- Use CSS Modules for component-specific styles
- Keep styles scoped to components
- Use semantic class names
- Follow BEM-like naming for clarity

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

1. **Unit Tests**: Test individual functions and components

   ```typescript
   import { describe, it, expect } from '@jest/globals';
   import { myFunction } from '../lib/myModule';

   describe('myFunction', () => {
     it('should return expected result', () => {
       expect(myFunction('input')).toBe('expected');
     });
   });
   ```

2. **Component Tests**: Test component rendering and interactions

   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react';
   import MyComponent from '../components/MyComponent';

   describe('MyComponent', () => {
     it('renders correctly', () => {
       render(<MyComponent title="Test" />);
       expect(screen.getByText('Test')).toBeInTheDocument();
     });
   });
   ```

3. **API Tests**: Test API endpoints

   ```typescript
   import { describe, it, expect } from '@jest/globals';
   import { GET } from '../app/api/my-endpoint/route';

   describe('GET /api/my-endpoint', () => {
     it('returns expected data', async () => {
       const response = await GET();
       expect(response.status).toBe(200);
     });
   });
   ```

### Test Coverage

- Aim for at least 70% code coverage
- Focus on critical business logic
- Test edge cases and error handling

## Submitting Changes

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions/updates

### Commit Messages

Follow the conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(api): add content summarization endpoint
fix(auth): resolve token expiration issue
docs(readme): update installation instructions
```

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the coding standards
3. **Write/update tests** for your changes
4. **Run tests** to ensure they pass
5. **Update documentation** if needed
6. **Commit your changes** with clear messages
7. **Push to your fork** and create a Pull Request
8. **Address review feedback** promptly

### Pull Request Checklist

- [ ] Code follows the project's style guidelines
- [ ] Tests have been added/updated
- [ ] All tests pass
- [ ] Documentation has been updated
- [ ] Commit messages follow the convention
- [ ] No console errors or warnings
- [ ] Code has been reviewed for security issues

## API Development Guidelines

### Creating New API Routes

When creating new API routes, use the App Router pattern in `/app/api/`:

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Your logic here
    return NextResponse.json({ data: 'response' });
  } catch (error) {
    return NextResponse.json({ error: 'Error message' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Your logic here
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error message' }, { status: 500 });
  }
}
```

### Authentication in API Routes

Use the authentication utilities from `/app/api/_utils/auth.ts`:

```typescript
import { verifyAuth } from '../_utils/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);

  if (!authResult.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your authenticated logic here
  return NextResponse.json({ data: 'protected data' });
}
```

### Error Handling

- Always use try-catch blocks
- Return appropriate HTTP status codes
- Provide meaningful error messages
- Log errors for debugging (without exposing sensitive data)

### API Documentation

- Document all endpoints in the relevant API file
- Include request/response examples
- Document required environment variables
- Update the README or create API docs when adding new features

## Getting Help

- Check existing [documentation](./docs/)
- Review [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)
- Look at existing code for examples
- Open an issue for questions or problems

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

Key points:

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

Thank you for contributing! 🎉
