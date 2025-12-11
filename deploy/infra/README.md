# Azure Infrastructure - Naming Conventions

This infrastructure follows the **NeuralLiquid Azure Naming Standards v3**.

## Recent Changes (December 2024)

### App Service Startup Command Configuration (Dec 10, 2024)

**Issue**: Container was terminating during startup because Azure App Service was using default Node.js startup (`npm start`) instead of running the Next.js standalone server.

**Fix**: Explicitly set `appCommandLine: 'node server.js'` in `main.bicep` for both production and staging slots.

**Technical Details**:

- Next.js standalone mode creates a minimal `server.js` that must be run directly
- Azure's managed Node.js runtime ignores `WEBSITE_STARTUP_FILE` when `appCommandLine` is empty
- Setting `appCommandLine` explicitly ensures the correct startup command is used
- This affects lines 88 and 182 in `main.bicep`

### DNS Module Restructuring

The DNS configuration has been split into two modules to resolve cross-resource-group deployment issues:

1. **`dns.bicep`** - References the existing DNS zone and provides zone information
2. **`dns-records.bicep`** - Creates DNS records (CNAME and TXT) in the DNS zone

This change fixes Bicep error BCP165 by ensuring DNS records are deployed with the correct scope (DNS zone's resource group).

**Before:** Single `dns.bicep` module tried to create child resources of a zone in a different resource group (not allowed).

**After:** Separate modules with proper scoping:

- `dns.bicep` - Deployed in app resource group, references existing zone
- `dns-records.bicep` - Deployed in DNS zone resource group, creates records

See `main.bicep` for usage example.

## Naming Pattern

All resources follow the pattern:

```
[org]-[env]-[project]-[type]-[region]
```

Resource groups use:

```
[org]-[env]-[project]-rg-[region]
```

## Valid Values

### Organisation Codes (org)

- `nl` - NeuralLiquid (default for this project)
- `pvc` - Phoenix VC
- `tws` - Twines & Straps
- `mys` - Mystira

### Environment Codes (env)

- `dev` - Development
- `staging` - Pre-production / QA
- `prod` - Production

### Project Codes

For NeuralLiquid (`nl`):

- `content-creation` - This project
- `rooivalk` - Counter-UAS platform
- `autopr` - Autopr automation platform
- `nl-core` - Shared NL foundation services
- `nl-ai` - Shared NL AI services

### Type Codes

- `app` - App Service / Web frontend
- `api` - Backend API
- `func` - Function App
- `swa` - Static Web App
- `asp` - App Service Plan
- `db` - Database
- `storage` - Storage account
- `kv` - Key Vault
- `queue` - Queues / Service Bus
- `cache` - Redis Cache
- `ai` - AI services (OpenAI/Cognitive)
- `acr` - Container registry
- `vnet` - Virtual Network
- `subnet` - Subnet
- `dns` - DNS resource
- `log` - Monitoring / Log workspace
- `rg` - Resource Group (special case)

### Region Codes

- `euw` - West Europe (default)
- `eun` - North Europe
- `wus` - West US
- `eus` - East US
- `san` - South Africa North
- `saf` - South Africa West
- `swe` - Sweden Central/North
- `uks` - UK South
- `usw` - US West (generic)
- `glob` - Global / regionless

## Examples

### Development Environment (West Europe)

```
nl-dev-content-creation-rg-euw         # Resource Group
nl-dev-content-creation-app-euw        # App Service
nl-dev-content-creation-asp-euw        # App Service Plan
nl-dev-content-creation-api-euw        # API Service
nl-dev-content-creation-db-euw         # Database
```

### Production Environment (South Africa North)

```
nl-prod-content-creation-rg-san        # Resource Group
nl-prod-content-creation-app-san       # App Service
nl-prod-content-creation-asp-san       # App Service Plan
```

### Staging Environment (West Europe)

```
nl-staging-content-creation-rg-euw     # Resource Group
nl-staging-content-creation-app-euw    # App Service
```

## Usage

### Shell Script (naming.sh)

The `naming.sh` script generates standardized names:

```bash
./infra/naming.sh <org> <env> <project> <region>

# Example:
./infra/naming.sh nl dev content-creation euw
```

Output (as environment variables):

```bash
RESOURCE_GROUP=nl-dev-content-creation-rg-euw
APP_NAME=nl-dev-content-creation-app-euw
ASP_NAME=nl-dev-content-creation-asp-euw
API_NAME=nl-dev-content-creation-api-euw
FUNC_NAME=nl-dev-content-creation-func-euw
STORAGE_NAME=nl-dev-content-creation-storage-euw
KV_NAME=nl-dev-content-creation-kv-euw
DB_NAME=nl-dev-content-creation-db-euw
```

### Bicep Module (naming.bicep)

⚠️ **Important Limitation**: Bicep module outputs cannot be used directly in resource `name` properties due to [BCP120](https://aka.ms/bicep/core-diagnostics#BCP120) - they aren't available at deployment start.

**✅ Correct Usage - Direct Variable Calculation:**

```bicep
@description('Organisation code')
@allowed(['nl', 'pvc', 'tws', 'mys'])
param org string = 'nl'

@description('Environment')
@allowed(['dev', 'staging', 'prod'])
param env string = 'dev'

@description('Project name')
param project string = 'content-creation'

@description('Region code')
@allowed(['euw', 'san', 'saf', 'swe', 'eun', 'wus', 'eus', 'uks', 'usw', 'glob'])
param region string = 'euw'

// Generate names directly (available at deployment start)
var base = '${org}-${env}-${project}'
var appName = '${base}-app-${region}'
var aspName = '${base}-asp-${region}'

// Optional: Deploy naming module for validation
module naming 'naming.bicep' = {
  name: 'naming-validation'
  params: {
    org: org
    env: env
    project: project
    region: region
  }
}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: aspName  // ✅ Works - direct variable
  // name: naming.outputs.name_asp  // ❌ Error BCP120
  ...
}

// You CAN use module outputs in deployment outputs
output validationCheck bool = naming.outputs.name_asp == aspName
```

### GitHub Actions

The workflow automatically generates names:

```yaml
env:
  ORG_CODE: 'nl'
  PROJECT_NAME: 'content-creation'
  REGION_CODE: 'euw'

steps:
  - name: Generate Resource Names
    run: |
      ./infra/naming.sh ${{ env.ORG_CODE }} ${{ github.event.inputs.environment || 'dev' }} ${{ env.PROJECT_NAME }} ${{ env.REGION_CODE }}
```

## Rules

1. **Lowercase only** - All segments must be lowercase
2. **No underscores** - Use hyphens (`-`) as separators
3. **No trailing hyphens** - Names must not end with `-`
4. **Allowed characters** - Only `a-z`, `0-9`, and `-`
5. **Immutable names** - Resource names cannot be changed after creation
6. **Validated codes** - All codes must be from the approved lists above
7. **No duplication** - Don't duplicate org code in project name (e.g., `nl-dev-nl-core-app-euw` ✅, `nl-dev-nl-nl-core-app-euw` ❌)

## Validation

The naming script validates all inputs:

```bash
# Valid
./infra/naming.sh nl dev content-creation euw  # ✅

# Invalid org code
./infra/naming.sh xyz dev content-creation euw  # ❌ Error

# Invalid environment
./infra/naming.sh nl test content-creation euw  # ❌ Error (should be 'staging')

# Invalid region
./infra/naming.sh nl dev content-creation xyz   # ❌ Error
```

## Migration Notes

### From Old Pattern

**Old (incorrect):**

```
dev-euw-rg-content-creation
dev-euw-app-content-creation
```

**New (correct):**

```
nl-dev-content-creation-rg-euw
nl-dev-content-creation-app-euw
```

**Changes:**

1. Added `nl` org code prefix
2. Moved type code before region code
3. Standardized segment order

### Renaming Resources

⚠️ **Most Azure resources cannot be renamed!**

To "rename" a resource:

1. Create new resource with correct name
2. Migrate configuration/data
3. Update DNS/traffic routing
4. Delete old resource

See the main naming standard document for the full capability matrix.

## Tags

All resources are automatically tagged:

```json
{
  "org": "nl",
  "environment": "dev",
  "project": "content-creation",
  "region": "euw",
  "managedBy": "bicep"
}
```

## References

- Full standard: See main Azure naming conventions documentation
- Bicep module: `infra/naming.bicep`
- Shell script: `infra/naming.sh`
- Workflow: `.github/workflows/azure-webapps-node.yml`
