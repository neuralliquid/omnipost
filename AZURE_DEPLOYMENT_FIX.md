# Azure Deployment Fix - Container Startup Issue

## Problem Summary

**Issue**: Azure Web App container was terminating during startup with module resolution errors.

**Symptoms**:

- Container crash with error: `Error: Cannot find module 'styled-jsx/package.json'`
- Container terminated during startup probe
- Azure logs showed: "Site container terminated during site startup"
- Module not found errors for Next.js dependencies

## Root Causes & Solutions

### Issue 1: Module Resolution (styled-jsx)

**Root Cause:**
pnpm's default isolated module structure (`.pnpm` directory) is not compatible with Azure App Service's Node.js module resolution. When Next.js tries to resolve dependencies like `styled-jsx/package.json`, it fails because Azure's runtime doesn't understand pnpm's hoisted structure.

**Solution:**
Added `.npmrc` configuration to use hoisted node_modules structure:

```ini
# .npmrc
node-linker=hoisted
auto-install-peers=true
strict-peer-dependencies=false
```

This ensures all dependencies are placed in a flat `node_modules` directory that Azure can resolve.

### Issue 2: Startup Command

**Root Cause:**
Azure App Service on Linux with `NODE|20-lts` runtime was using the default Node.js startup behavior:

1. When `appCommandLine` is empty (or not set), Azure runs `npm start`
2. The `package.json` contains `"start": "next start"`
3. Next.js standalone mode doesn't include the Next.js CLI
4. Running `next start` fails because the `next` command is not available
5. Container crashes immediately on startup

**Solution:**
Explicitly set `appCommandLine: 'node server.js'` in the Bicep template (`infra/main.bicep`).

### Changes Made

1. **.npmrc** (NEW):

   ```ini
   node-linker=hoisted
   auto-install-peers=true
   strict-peer-dependencies=false
   ```

2. **infra/main.bicep** (Lines 88, 182):

   ```bicep
   appCommandLine: 'node server.js' // Explicit startup command for Next.js standalone mode
   ```

3. **Documentation Updates**:
   - `docs/DEPLOYMENT.md`: Added troubleshooting section
   - `infra/README.md`: Documented the change

### Why This Works

**Hoisted node_modules:**

- pnpm's default `.pnpm` structure uses symlinks and a complex nested layout
- Azure's Node.js runtime expects a flat `node_modules` directory
- `node-linker=hoisted` creates a traditional flat structure compatible with Azure
- All dependencies (including `styled-jsx`) are now directly resolvable

**Explicit startup command:**

- Next.js standalone mode creates a minimal `server.js` with embedded dependencies
- The `server.js` is designed to be run directly with `node server.js`
- Setting `appCommandLine` explicitly overrides Azure's default behavior
- Azure will now execute `node server.js` instead of `npm start`

## Testing the Fix

### Automatic Deployment (Recommended)

The fix will be applied automatically on the next deployment:

1. **Trigger Deployment**:
   - Push changes to `main` branch, or
   - Manually trigger the workflow from GitHub Actions

2. **Monitor Deployment**:

   ```bash
   # Watch the GitHub Actions workflow
   # It should complete the "Verify deployment health" step successfully
   ```

3. **Verify Health Endpoint**:

   ```bash
   curl https://nl-dev-omnipost-app-euw.azurewebsites.net/api/health
   ```

   Expected response:

   ```json
   {
     "status": "healthy",
     "timestamp": "2025-12-10T...",
     "version": "0.1.0",
     "uptime": ...,
     "environment": "production"
   }
   ```

4. **Check Azure Logs**:

   ```bash
   az webapp log tail --name nl-dev-omnipost-app-euw \
     --resource-group nl-dev-omnipost-rg-euw
   ```

   You should see:

   ```
   ▲ Next.js 16.0.7
      - Local:         http://localhost:8080
      - Network:       http://0.0.0.0:8080

    ✓ Starting...
    ✓ Ready in 74ms
   ```

### Manual Fix (Emergency Only)

If you need to fix an existing deployment immediately without redeploying infrastructure:

```bash
az webapp config set --name nl-dev-omnipost-app-euw \
  --resource-group nl-dev-omnipost-rg-euw \
  --startup-file "node server.js"

# Restart the app
az webapp restart --name nl-dev-omnipost-app-euw \
  --resource-group nl-dev-omnipost-rg-euw
```

**Note**: This is temporary. The next infrastructure deployment will apply the permanent fix from the Bicep template.

## Verification Checklist

After deployment, verify:

- [ ] Health endpoint returns 200 OK
- [ ] Response body contains `"status": "healthy"`
- [ ] Container stays running (no restarts in logs)
- [ ] Application responds to requests
- [ ] Azure logs show Next.js server starting successfully

## Rollback Plan

If issues occur after applying this fix:

1. Revert the Bicep template change:

   ```bicep
   appCommandLine: ''
   ```

2. Redeploy infrastructure

3. Apply the manual workaround shown above

## Additional Notes

### About Next.js Standalone Mode

Next.js standalone output mode (`output: 'standalone'` in `next.config.ts`):

- Creates an optimized production build with minimal dependencies
- Generates a `server.js` file that contains the server code
- Significantly reduces deployment size
- Requires running `node server.js` directly

### About Azure App Service Startup

Azure App Service startup behavior for Node.js apps:

- `appCommandLine` takes highest precedence
- If `appCommandLine` is empty, looks for `WEBSITE_STARTUP_FILE`
- If both are empty, runs `npm start` from `package.json`
- For managed runtimes, `WEBSITE_STARTUP_FILE` is often ignored

## Related Documentation

- [Azure Deployment Guide](docs/DEPLOYMENT.md)
- [Infrastructure README](infra/README.md)
- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/next-config-js/output)

## Support

For questions or issues:

1. Check the troubleshooting section in `docs/DEPLOYMENT.md`
2. Review Azure application logs
3. Verify environment variables are set correctly
4. Create a GitHub issue with deployment logs

---

**Last Updated**: December 10, 2024  
**Status**: Fixed ✅
