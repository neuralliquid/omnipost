# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
