# Frontend Technology Stack

> **Layer**: Frontend
> **Technologies**: Next.js 14+, React 18+, TypeScript 5.3+ (strict mode)
> **Last Updated**: December 2025

---

## Overview

The OmniPost frontend is built on a modern React foundation using Next.js as the full-stack framework. TypeScript with strict mode ensures type safety across the entire codebase.

---

## Core Technologies

### Next.js 14+

| Aspect            | Details                                      |
| ----------------- | -------------------------------------------- |
| **Version**       | Latest (14+)                                 |
| **Router**        | Hybrid: App Router (API) + Pages Router (UI) |
| **Rendering**     | SSR/SSG capable, currently client-heavy      |
| **Configuration** | `next.config.ts` with TypeScript             |

**Key Features Used:**

- App Router for API routes (`/app/api/*/route.ts`)
- Pages Router for page components (`/pages/*.tsx`)
- Middleware for authentication (`middleware.ts`)
- Image optimization configuration
- Security headers configuration
- React Strict Mode enabled

**Configuration Highlights:**

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { domains: ['example.com'] },
  // Security headers configured
  // CSP, HSTS, X-Frame-Options, etc.
};
```

### React 18+

| Aspect         | Details                           |
| -------------- | --------------------------------- |
| **Version**    | Latest (18+)                      |
| **Components** | 100% Function Components          |
| **Hooks**      | useState, useEffect, custom hooks |
| **State**      | Local state + Context API         |

**Patterns Used:**

- Function components exclusively
- Custom hooks for business logic encapsulation
- Error boundaries for graceful error handling
- Controlled form components

**Custom Hooks:**
| Hook | Purpose | Location |
|------|---------|----------|
| `useReviewProcess` | Content review workflow state | `/hooks/useReviewProcess.ts` |
| `useAutomationTools` | Automation tool management | `/hooks/useAutomationTools.ts` |
| `useEngagementMetrics` | Analytics data fetching | `/hooks/useEngagementMetrics.ts` |
| `useSeries` | Series management | `/hooks/useSeries.ts` |

### TypeScript 5.3+

| Aspect          | Details |
| --------------- | ------- |
| **Version**     | ^5.3.3  |
| **Strict Mode** | Enabled |
| **Target**      | ES2015  |
| **Module**      | ESNext  |

**Strict Mode Settings:**

```json
{
  "compilerOptions": {
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "isolatedModules": true
  }
}
```

**Path Aliases:**

```json
{
  "@/*": ["./*"],
  "@/components/*": ["components/*"],
  "@/lib/*": ["lib/*"],
  "@/hooks/*": ["hooks/*"],
  "@/types/*": ["types/*"]
}
```

---

## Component Architecture

### Directory Structure

```
components/
├── adaptation/          # Content adaptation (3 components)
│   ├── AdaptationExamples.tsx
│   ├── ContentAdaptationStyles.tsx
│   └── WorkflowDiagram.tsx
├── automation/          # Automation tools (4 components)
│   ├── ConclusionSection.tsx
│   ├── ToolCard.tsx
│   ├── ToolDetailModal.tsx
│   └── ToolGrid.tsx
├── content/             # Content management (6 components)
│   ├── AirtableIntegration.tsx
│   ├── ContentAdaptation.tsx
│   ├── ContentHeader.tsx
│   ├── ContentManager.tsx
│   ├── PlatformCard.tsx
│   └── WorkflowDiagram.tsx
├── dashboard/           # Analytics (3 components)
│   ├── Analytics.tsx
│   ├── EngagementMetrics.tsx
│   └── MetricsCard.tsx
├── feature-flags/       # Feature flag UI (2 components)
│   ├── FeatureFlagToggle.tsx
│   └── FeatureFlagsManager.tsx
├── feedback/            # Feedback forms (2 components)
│   ├── FeedbackForm.tsx
│   └── FeedbackMechanism.tsx
├── image/               # Image generation (3 components)
│   ├── ImageGeneration.tsx
│   ├── ImageGenerationForm.tsx
│   └── ImageGenerator.tsx
├── layouts/             # Page layouts (3 components)
│   ├── DashboardLayout.tsx
│   ├── Layout.tsx
│   └── MainLayout.tsx
├── platform/            # Platform integration (2 components)
│   ├── PlatformConnectors.tsx
│   └── PlatformSelector.tsx
├── review/              # Review workflow (6 components)
│   ├── ImageGenerationStage.tsx
│   ├── InputStage.tsx
│   ├── LoadingOverlay.tsx
│   ├── ParsingStage.tsx
│   ├── ProgressBar.tsx
│   ├── SuccessMessage.tsx
│   └── SummarizationStage.tsx
├── series/              # Series management (3 components)
│   ├── EmptyState.tsx
│   ├── SeriesCard.tsx
│   └── SeriesForm.tsx
├── text/                # Text processing (3 components)
│   ├── SummarizationAPI.tsx
│   ├── TextParser.tsx
│   └── TextSummarizer.tsx
├── ui/                  # Shared UI (14 components)
│   ├── AdaptationCard.tsx
│   ├── AuditTrail.tsx
│   ├── Authentication.tsx
│   ├── ErrorMessage.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Layout.tsx
│   ├── LoadingState.tsx
│   ├── LoginForm.tsx
│   ├── MobileResponsiveness.tsx
│   ├── NavigationLinks.tsx
│   ├── NotificationSystem.tsx
│   └── WorkflowStage.tsx
├── AutomationToolDetail.tsx
├── ErrorBoundary.tsx
└── RelatedPagesSuggestions.tsx
```

**Total Components:** ~58

### Component Patterns

**Standard Component Structure:**

```typescript
// components/feature/FeatureComponent.tsx
import { useState } from 'react';
import type { FeatureProps } from '@/types';

interface Props {
  data: FeatureProps;
  onAction: () => void;
}

export function FeatureComponent({ data, onAction }: Props) {
  const [state, setState] = useState(initialState);

  // Component logic

  return (
    <div className="feature-component">
      {/* JSX */}
    </div>
  );
}
```

---

## Styling

### Approach

| Method            | Usage                   |
| ----------------- | ----------------------- |
| **CSS Modules**   | Component-scoped styles |
| **Global CSS**    | Application-wide styles |
| **Inline Styles** | Dynamic styling         |

### File Structure

```
styles/
├── globals.css          # Global styles
└── [component].module.css  # Component-specific
```

---

## State Management

### Local State

- `useState` for component-level state
- `useReducer` for complex state logic

### Server State

- Custom hooks with Axios for API calls
- Manual loading/error state management

### Global State

- Feature flags via custom module
- Authentication state via Context (implicit)

### URL State

- Next.js router for navigation
- Query parameters for filters

---

## Data Fetching

### Current Pattern

```typescript
// hooks/useReviewProcess.ts
export function useReviewProcess() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/endpoint', payload);
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, fetchData };
}
```

### HTTP Client

- **Axios** for all API requests
- Centralized API client in `/lib/api-client.ts`

---

## UI Libraries

### Markdown Rendering

- **react-markdown** (^10.1.0) for content display

### No UI Framework

- Custom CSS styling
- No Tailwind, Material UI, or similar

---

## Pages Structure

```
pages/
├── _app.tsx                    # App wrapper
├── _document.tsx               # Document customization
├── index.tsx                   # Landing page
├── 404.tsx                     # Not found page
├── automation.tsx              # Automation tools
├── content-adaptation.tsx      # Content adaptation
├── human-review.tsx            # Review workflow
├── performance-dashboard.tsx   # Analytics dashboard
├── platform-analysis.tsx       # Platform analysis
├── series.tsx                  # Series management
└── workflow.tsx                # Workflow page
```

---

## Type Definitions

### Location

- `/types/` directory for shared types
- Inline interfaces for component props

### Key Types

```typescript
// types/index.ts
export interface Platform {
  id: number;
  name: string;
}

export interface ContentType {
  id?: string;
  title?: string;
  description?: string;
}

export interface FeatureFlags {
  textParser: TextParserFeatureFlag;
  imageGeneration: boolean;
  summarization: boolean;
  // ... more flags
}
```

---

## Build & Development

### Scripts

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Quality
npm run type-check   # TypeScript validation
npm run lint         # ESLint check
npm run format       # Prettier format
```

### Development Experience

- Hot Module Replacement (HMR)
- TypeScript error overlay
- ESLint integration
- Path alias support

---

## Best Practices Compliance

| Practice               | Status | Notes                        |
| ---------------------- | ------ | ---------------------------- |
| Function components    | ✅     | 100% compliance              |
| TypeScript strict mode | ✅     | Enabled                      |
| React Strict Mode      | ✅     | Enabled                      |
| Custom hooks           | ✅     | Business logic extracted     |
| Error boundaries       | ✅     | ErrorBoundary component      |
| Server Components      | ❌     | Pages Router doesn't support |
| App Router migration   | 🔄     | In progress (API only)       |

---

## Recommendations

### Short-term

1. Complete App Router migration for pages
2. Add React.memo() to expensive components
3. Implement loading.tsx and error.tsx boundaries

### Medium-term

1. Adopt Server Components where beneficial
2. Add SWR or React Query for server state
3. Consider Tailwind CSS for consistent styling

### Long-term

1. Full App Router adoption
2. Streaming SSR implementation
3. Component library extraction

---

_This document details the frontend technology stack for the OmniPost._
