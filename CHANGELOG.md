# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha] — 2026-03-30

### Added

- **Sluice AI Gateway** — OpenAI-compatible gateway client for centralized AI routing, cost tracking, and model abstraction (`lib/clients/sluice-gateway.ts`, `infra/sluice.bicep`)
- **Retort Agent Orchestration** — Multi-tool agent config from single YAML spec: `.agentkit/spec/` generates `CLAUDE.md`, `AGENTS.md`, `AGENT_TEAMS.md`, `QUALITY_GATES.md`, `.cursor/rules/`, `.windsurf/rules/`
- **34 Marketing Skills** — Full Agent Skills Spec library in `.agents/skills/` covering CRO (7), content (6), SEO (6), growth (11), analytics (4), with OmniPost-specific context overlays
- **Signup + Onboarding** — Registration flow with password strength indicator, 3-step guided onboarding with session persistence
- **Landing Page CRO** — Conversion-optimized hero, features, social proof, and CTA sections
- **Pricing Page** — 3-tier pricing (Free/$19/$49) with billing toggle, feature comparison, FAQ accordion, FAQ-Page schema
- **Analytics System** — AARRR event tracking with client-side batched tracker, API endpoint, `useAnalytics` hook wired into all pages
- **Content Creation Flow** — Write → adapt per platform (char limits, hashtags) → schedule/publish workflow
- **Platform Settings** — Connect/disconnect platforms with settings hub
- **Auth Middleware** — JWT validation middleware injecting identity headers for API routes
- **SEO Foundations** — Environment-aware robots.ts, sitemap.ts, Open Graph metadata, JSON-LD structured data
- **CSS Design System** — Custom properties for colors/spacing/shadows, dark mode via `prefers-color-scheme`, `prefers-reduced-motion` support
- **UI Components** — LoadingSpinner, EmptyState, PageSkeleton, ScrollLink with keyboard accessibility
- **Launch Assets** — Blog post, 10+ social posts, launch email, Product Hunt brief, press release
- **Test Suites** — Analytics events, tracker, sluice gateway, middleware, scheduler routes, LoadingSpinner, EmptyState, PageSkeleton, StructuredData
- **Getting Started Guide** — `docs/GETTING_STARTED.md` with prerequisites, quick start, configuration, troubleshooting

### Fixed

- **BUG-04** — Error boundaries wrapping dashboard and marketing layouts
- **BUG-06** — Rate limit race condition with safe eviction strategy
- **BUG-07** — Feature flag cascade in parse endpoint (only checks textParser)
- **BUG-08** — Token null check in JWT verification
- **BUG-09** — Missing auth middleware (created middleware.ts)
- **XSS** — HTML-escaped error messages in signup form
- **Timing attack** — Constant-time CRON_SECRET comparison in scheduler
- **Ownership** — Leads and forms API routes verify resource belongs to authenticated user
- **Analytics auth** — GET /api/analytics/events requires authentication
- **Gateway format** — Sluice gateway sends correct OpenAI messages format

### Changed

- CI pipeline now runs ESLint (`pnpm lint`) in addition to type-check, tests, and format
- Feature flags extended with `aiGateway` for Sluice opt-in
- All CSS modules migrated from hardcoded hex to CSS custom properties
- copilot-instructions.md appended with agent teams, marketing skills, and Sluice sections

---

## [Unreleased]

### Added

- **Azure AI Foundry Integration** - New AI client supporting chat completions, summarization, image generation, and embeddings (`lib/clients/azure-ai-foundry.ts`)
- **Health Check Endpoint** - `/api/health` endpoint with detailed system status and component checks
- **Password Handling** - Secure password hashing with bcryptjs, validation, and secure password generation (`lib/auth/password.ts`)
- **Secrets Manager** - Unified secrets management with Azure Key Vault support and caching (`lib/secrets/secrets-manager.ts`)
- **Retry Utility** - Generic retry logic with exponential backoff, jitter, and preset configurations (`lib/utils/retry.ts`)
- **Feature Flag Enhancements** - Added Azure AI Foundry as implementation option for AI services
- Comprehensive technology stack documentation (`docs/analysis/stack/`)
- Implementation assessment scores (`docs/analysis/scores/`)
- Best practices benchmark documentation
- ADR (Architecture Decision Records) documentation

### Changed

- Updated feature flag interfaces to support structured configurations for AI services
- Enhanced `ImageGenerationFeatureFlag` with provider selection (`huggingface`, `azure-foundry`, `dall-e`)
- Enhanced `SummarizationFeatureFlag` with provider selection (`huggingface`, `azure-foundry`, `openai`)
- Enhanced `TextParserFeatureFlag` with Azure Foundry option
- Consolidated `components/common/` and `components/shared/` into a single `components/ui/` directory for better organization
- Updated package.json metadata with proper project name, description, and repository information
- Enhanced TypeScript configuration with better path aliases for cleaner imports
- Improved Jest configuration to properly handle ES modules

### Security

- Fixed 4 npm vulnerabilities (1 critical, 1 high, 2 moderate)
  - Critical: Next.js RCE vulnerability (GHSA-9qr9-h5gf-34mp)
  - High: jws HMAC signature verification bypass (GHSA-869p-cjfg-cm3x)
  - Moderate: mdast-util-to-hast XSS (GHSA-4fh9-h7wg-q85m)
  - Moderate: Nodemailer DoS (GHSA-rcmh-qjqh-p98v)
- Added bcryptjs for secure password hashing (12 salt rounds)
- Added secrets management infrastructure with Key Vault support

### Documentation

- Added `.editorconfig` for consistent coding style across different editors
- Added `.nvmrc` to specify Node.js version (18.20.0)
- Added ESLint configuration (`.eslintrc.json`) for code quality
- Added Prettier configuration (`.prettierrc` and `.prettierignore`) for code formatting
- Added npm scripts for linting and formatting (`lint`, `lint:fix`, `format`, `format:check`)
- Added comprehensive path aliases in `tsconfig.json` for cleaner imports
- Added CHANGELOG.md for tracking project changes
- Added SECURITY.md for security policy and vulnerability reporting

## [1.0.0] - Initial Release

### Added

- Initial project structure with Next.js App Router and Pages Router
- Content creation and management features
- AI-powered text processing and image generation
- Multi-platform publishing capabilities
- Authentication and authorization system
- Comprehensive testing setup with Jest
- Azure deployment configuration
- Documentation (README, PROJECT_STRUCTURE, CONTRIBUTING)
