# pnpm Configuration

## Overview

This project uses pnpm as its package manager with specific configuration for Azure App Service compatibility.

## Configuration File: `.npmrc`

```ini
# pnpm configuration for Azure deployment compatibility
# Use hoisted node_modules structure instead of isolated .pnpm structure
# This ensures proper module resolution in Azure App Service
node-linker=hoisted

# Automatically install peer dependencies
auto-install-peers=true

# Use strict peer dependencies (recommended for production)
strict-peer-dependencies=false
```

## Why Hoisted node_modules?

### The Problem

pnpm's default behavior uses an isolated module structure (`.pnpm` directory) that:

- Uses symlinks to share packages between projects
- Creates a nested dependency graph optimized for disk space
- Prevents access to undeclared dependencies

While this is excellent for local development and disk space efficiency, it causes issues with Azure App Service:

- Azure's Node.js runtime doesn't properly resolve pnpm's symlinked structure
- Module resolution fails for indirect dependencies (e.g., `styled-jsx/package.json`)
- Container crashes during startup with "Cannot find module" errors

### The Solution

Using `node-linker=hoisted` creates a traditional flat `node_modules` directory:

- All dependencies are placed directly in `node_modules/`
- No symlinks - actual files are copied
- Compatible with Azure App Service and other cloud platforms
- Standard Node.js module resolution works correctly

## Trade-offs

### Advantages

✅ Compatible with Azure App Service and most cloud platforms
✅ Standard Node.js module resolution
✅ No symlink issues
✅ Easier to debug module resolution issues

### Disadvantages

❌ Uses more disk space (dependencies are copied, not linked)
❌ Slower installs compared to pnpm's default mode
❌ Allows access to undeclared dependencies (phantom dependencies)

## Local Development

The hoisted configuration works seamlessly for local development:

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## CI/CD Pipeline

The GitHub Actions workflow automatically uses this configuration:

```yaml
- name: Install, build, and test
  run: |
    pnpm install --frozen-lockfile
    pnpm run build
```

The `--frozen-lockfile` flag ensures the lockfile isn't modified during CI builds.

## Changing the Configuration

If you need to modify the pnpm configuration, edit `.npmrc` and test thoroughly:

1. Delete `node_modules` and `pnpm-lock.yaml`
2. Run `pnpm install`
3. Build and test locally
4. Test in Azure before merging

## Alternative: npm or yarn

If pnpm causes issues, you can switch to npm or yarn:

```bash
# Remove pnpm files
rm -rf node_modules pnpm-lock.yaml .npmrc

# Use npm
npm install
npm run build

# Or use yarn
yarn install
yarn build
```

Update `package.json` to remove the `packageManager` field if switching.

## References

- [pnpm Configuration](https://pnpm.io/npmrc)
- [pnpm node-linker](https://pnpm.io/npmrc#node-linker)
- [Azure App Service Node.js](https://docs.microsoft.com/en-us/azure/app-service/quickstart-nodejs)
- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/next-config-js/output)

---

**Last Updated**: December 11, 2024  
**Status**: Production Ready ✅
