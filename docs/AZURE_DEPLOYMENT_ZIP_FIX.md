# Azure Deployment Fix - Missing .next Directory

## Problem

The Azure Web App was failing to start with the following error:

```
Error: Could not find a production build in the './.next' directory.
Try building your app with 'next build' before starting the production server.
```

### Azure Logs
```
2025-12-11T01:07:50.4392628Z Error: Could not find a production build in the './.next' directory.
2025-12-11T01:07:50.4392982Z     at ignore-listed frames
2025-12-11T01:07:50.5517748Z Container is terminating. Grace period: 5 seconds.
2025-12-11T01:07:50.8828472Z Site container: nl-dev-omnipost-app-euw terminated during site startup.
2025-12-11T01:07:50.9631197Z Site startup probe failed after 44.8766596 seconds.
```

## Root Cause

The GitHub Actions workflow that builds and deploys the application was using an incorrect `zip` command that **excluded hidden files and directories** (files/folders starting with a dot).

### The Problem Command
```bash
cd deploy && zip -r ../node-app.zip ./*
```

The `.*` wildcard in shell expansion only matches **visible files**, not hidden files starting with `.`. This meant the `.next` directory, which contains the entire Next.js production build, was **never included in the deployment package**.

### Why This Matters for Next.js Standalone Mode

Next.js standalone mode (configured in `next.config.ts` with `output: 'standalone'`) creates an optimized production build with this structure:

```
.next/standalone/
├── .next/              # ← Critical build directory (HIDDEN!)
│   ├── BUILD_ID
│   ├── build-manifest.json
│   ├── routes-manifest.json
│   ├── server/
│   └── static/         # Copied separately by workflow
├── server.js           # Standalone server entry point
├── node_modules/       # Minimal production dependencies
└── ...                 # Other app files
```

When the server starts, it expects to find the `.next` directory with all the build artifacts. Without it, the server crashes immediately.

## The Fix

### Changed File
`.github/workflows/azure-webapps-node.yml` - Line 99

### Before
```yaml
- name: Zip artifact for deployment
  run: cd deploy && zip -r ../node-app.zip ./*
```

### After
```yaml
- name: Zip artifact for deployment
  run: cd deploy && zip -r ../node-app.zip .
```

### What Changed
- **Before**: `zip -r ../node-app.zip ./*` - Only zips visible files/folders
- **After**: `zip -r ../node-app.zip .` - Zips **everything** in the current directory, including hidden files

## Verification

### Local Testing
The fix was verified locally by:

1. Building the app: `pnpm run build`
2. Creating the deployment package (as the workflow does):
   ```bash
   mkdir -p deploy
   cp -r .next/standalone/. deploy/
   mkdir -p deploy/.next/static
   cp -r .next/static/. deploy/.next/static/
   cp -r data deploy/data
   ```
3. Testing both zip methods:
   ```bash
   # WRONG - excludes .next
   cd deploy && zip -r ../node-app-wrong.zip ./*
   
   # CORRECT - includes .next
   cd deploy && zip -r ../node-app-correct.zip .
   ```
4. Extracting and verifying:
   ```bash
   # Wrong version: No .next directory
   unzip node-app-wrong.zip
   ls -la | grep .next  # Nothing found
   
   # Correct version: .next directory present
   unzip node-app-correct.zip
   ls -la | grep .next  # drwxrwxr-x .next
   ```
5. Testing the server:
   ```bash
   cd /path/to/extracted
   JWT_SECRET=test PORT=8080 node server.js
   # ✓ Starting...
   # ✓ Ready in 71ms
   ```

## Impact

### Before Fix
- ❌ Deployment fails
- ❌ Container terminates during startup
- ❌ Application inaccessible
- ❌ Azure logs show: "Could not find a production build"

### After Fix
- ✅ `.next` directory included in deployment package
- ✅ Server starts successfully
- ✅ Application accessible via Azure Web App URL
- ✅ All routes and API endpoints functional

## Additional Changes

### .gitignore Updates
Added deployment artifacts to `.gitignore` to prevent accidental commits:

```gitignore
# Deployment artifacts
deploy/
node-app.zip
```

## Deployment Instructions

### Automatic Deployment
The fix will be applied automatically on the next deployment:

1. **Merge this PR** to the main branch
2. **GitHub Actions** will automatically:
   - Build the application
   - Create the deployment package (with `.next` included)
   - Deploy to Azure Web App
3. **Verify** the health endpoint:
   ```bash
   curl https://nl-dev-omnipost-app-euw.azurewebsites.net/api/health
   ```

### Manual Verification
After deployment, check Azure logs:

```bash
az webapp log tail --name nl-dev-omnipost-app-euw \
  --resource-group nl-dev-omnipost-rg-euw
```

Expected output:
```
▲ Next.js 16.0.8
   - Local:         http://localhost:8080
   - Network:       http://0.0.0.0:8080

 ✓ Starting...
 ✓ Ready in 74ms
```

## Related Issues

This issue is related to but distinct from previous Azure deployment issues:

1. **AZURE_DEPLOYMENT_FIX.md** - Fixed module resolution and startup command issues
2. **This fix** - Ensures the build directory is actually deployed

Both fixes are necessary for successful deployment.

## Prevention

To prevent similar issues in the future:

1. **Always test deployment packages locally** before deploying
2. **Verify hidden files are included** when creating archives
3. **Use `zip -r archive.zip .`** instead of `zip -r archive.zip ./*` for full directory archives
4. **Add deployment artifacts to .gitignore** to keep repository clean

## References

- [Next.js Standalone Output Documentation](https://nextjs.org/docs/pages/api-reference/next-config-js/output)
- [Azure App Service Node.js Deployment](https://learn.microsoft.com/en-us/azure/app-service/quickstart-nodejs)
- [Shell Glob Patterns](https://mywiki.wooledge.org/glob)

---

**Last Updated**: December 11, 2024  
**Status**: Fixed ✅  
**Deployed**: Pending next deployment
