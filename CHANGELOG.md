# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Consolidated `components/common/` and `components/shared/` into a single `components/ui/` directory for better organization
- Updated package.json metadata with proper project name, description, and repository information
- Enhanced TypeScript configuration with better path aliases for cleaner imports
- Improved Jest configuration to properly handle ES modules

### Added
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
