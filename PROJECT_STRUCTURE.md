# Project Structure

This document provides an overview of the project's directory structure and organization.

## Directory Overview

```
content_creation/
├── app/                    # Next.js App Router (Route Handlers)
│   └── api/               # API routes using App Router pattern
│       ├── _utils/        # Shared API utilities
│       ├── audit/         # Audit trail endpoints
│       ├── auth/          # Authentication endpoints
│       ├── content/       # Content management endpoints
│       ├── feature-flags/ # Feature flag endpoints
│       ├── feedback/      # User feedback endpoints
│       ├── images/        # Image generation endpoints
│       ├── notifications/ # Notification system endpoints
│       ├── parse/         # Text parsing endpoints
│       ├── platforms/     # Platform integration endpoints
│       ├── queue/         # Content queue endpoints
│       └── summarize/     # Text summarization endpoints
│
├── pages/                 # Next.js Pages Router
│   ├── api/              # Legacy API routes (being migrated to app/api)
│   ├── _app.tsx          # Custom App component
│   ├── _document.tsx     # Custom Document component
│   ├── index.tsx         # Landing page
│   ├── automation.tsx    # Automation tools page
│   ├── content-adaptation.tsx
│   ├── human-review.tsx
│   ├── performance-dashboard.tsx
│   ├── platform-analysis.tsx
│   ├── series.tsx        # Series management page
│   ├── workflow.tsx      # Workflow visualization page
│   └── 404.tsx          # Custom 404 page
│
├── components/            # React components
│   ├── adaptation/       # Content adaptation components
│   ├── automation/       # Automation tool components
│   ├── common/          # Common/shared components
│   ├── content/         # Content management components
│   ├── dashboard/       # Dashboard components
│   ├── feature-flags/   # Feature flag UI components
│   ├── feedback/        # Feedback mechanism components
│   ├── image/           # Image generation components
│   ├── layouts/         # Layout components
│   ├── platform/        # Platform integration components
│   ├── review/          # Human review workflow components
│   ├── series/          # Series management components
│   ├── shared/          # Legacy shared components (being consolidated)
│   └── text/            # Text processing components
│
├── lib/                   # Core business logic and utilities
│   ├── api-client.ts     # API client utilities
│   ├── auth/             # Authentication services
│   ├── clients/          # External API clients (e.g., Hugging Face)
│   ├── data/             # Data access layer (e.g., Airtable)
│   └── storage/          # Storage utilities (e.g., token storage)
│
├── hooks/                 # React custom hooks
│   ├── useAutomationTools.ts
│   ├── useEngagementMetrics.ts
│   ├── useReviewProcess.ts
│   └── useSeries.ts
│
├── types/                 # TypeScript type definitions
│   ├── automation.ts
│   ├── index.ts
│   ├── platform.ts
│   └── series.ts
│
├── utils/                 # Utility functions
│   └── featureFlags.ts
│
├── middleware/            # Middleware functions
│   └── withAuth.ts       # Authentication middleware
│
├── styles/                # CSS modules and global styles
│   ├── globals.css       # Global styles
│   └── *.module.css      # Component-specific CSS modules
│
├── config/                # Configuration files
│   └── platforms.ts      # Platform configurations
│
├── content/               # Static content and data
│   ├── adaptationExamples.json
│   ├── automationTools.json
│   └── reviewConfig.json
│
├── data/                  # Application data
│   ├── feature-flags.json
│   └── workflowStages.ts
│
├── docs/                  # Documentation
│   ├── api-migration-todo.md
│   └── next-api-best-practices.md
│
├── infra/                 # Infrastructure as Code
│   ├── main.bicep        # Azure Bicep template
│   ├── naming.sh         # Resource naming script
│   └── parameters.json   # Bicep parameters
│
├── scripts/               # Utility scripts
│   ├── cleanup-old-api.js
│   └── verify-api-routes.js
│
├── __tests__/             # Test files
│   ├── api/              # API route tests
│   ├── integration/      # Integration tests
│   └── lib/              # Library tests
│
└── next-best-practices/   # Best practice documentation
    └── frontend/         # Frontend best practices

```

## Key Directories Explained

### `/app/api/` - Modern API Routes
This directory contains the new API route handlers following the Next.js App Router pattern. These are gradually replacing the legacy API routes in `/pages/api/`.

**Key Features:**
- Uses standard Web Request/Response APIs
- Better TypeScript support
- More flexible middleware options
- Located in `_utils/` subfolder for shared logic

### `/pages/` - Pages and Legacy API Routes
Contains the Next.js pages and legacy API routes. The API routes in `/pages/api/` are being migrated to `/app/api/` as documented in `docs/api-migration-todo.md`.

### `/components/` - React Components
Organized by feature/domain. Components are grouped into logical categories:
- Feature-specific folders (e.g., `automation/`, `platform/`)
- Shared components in `common/` and `shared/` (being consolidated)
- Layout components in `layouts/`

Each component folder typically includes an `index.ts` for clean exports.

### `/lib/` - Core Business Logic
Contains reusable business logic, services, and utilities:
- **`auth/`**: Authentication and authorization services
- **`clients/`**: External API clients
- **`data/`**: Data access and persistence logic
- **`storage/`**: Storage abstractions

### `/types/` - TypeScript Types
Centralized type definitions for better type safety and code sharing.

### `/infra/` - Infrastructure
Azure infrastructure definitions using Bicep templates for deployment.

### `/docs/` - Documentation
Project documentation including API migration guides and best practices.

## File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Styles**: kebab-case with `.module.css` (e.g., `user-profile.module.css`)
- **Types**: PascalCase for interfaces/types (e.g., `type UserData = ...`)
- **API Routes**: lowercase with hyphens (e.g., `feature-flags/`)

## Migration Status

The project is currently migrating from Pages Router API routes to App Router Route Handlers:
- ✅ New endpoints are being added in `/app/api/`
- 🔄 Legacy endpoints in `/pages/api/` are being deprecated
- 📝 See `docs/api-migration-todo.md` for detailed migration status

## Development Workflow

1. **API Development**: Use `/app/api/` for new endpoints
2. **Component Development**: Place in appropriate feature folder under `/components/`
3. **Business Logic**: Add to `/lib/` directory
4. **Types**: Define in `/types/` directory
5. **Tests**: Mirror the source structure in `/__tests__/`

## Notes

- The project uses Next.js with both Pages and App Router patterns during migration
- CSS Modules are used for component styling
- TypeScript is used throughout the project
- Azure is the deployment target (see `/infra/` directory)
