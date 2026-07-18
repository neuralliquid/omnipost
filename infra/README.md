# Azure Infrastructure - Naming Conventions

This infrastructure follows the **NeuralLiquid Azure Naming Standards v3**, with
the **region suffix dropped per [ADR-0027](https://github.com/JustAGhosT/mystira-workspace/blob/main/docs/architecture/adr/0027-azure-resource-naming-convention.md)**
(originally a mystira ADR; adopted for omnipost on 2026-05-10).

## Current Ownership

Runtime infrastructure for the live dev app is now represented in Terraform at
`infra/terraform/env/dev`.

DNS records for `omnipost.neuralliquid.ai` are owned by the `neuralliquid-org`
Terraform DNS stack. Do not manage `neuralliquid.ai` records from this repo.

The remaining Bicep files are legacy/runtime helpers retained during quick
iteration. DNS and custom-domain Bicep modules have been removed.

## Recent Changes

### Terraform Runtime Import (July 2026)

The live dev runtime was imported into Terraform with no live Azure changes:

- resource group
- App Service Plan
- Linux Web App
- Log Analytics workspace
- Application Insights
- metric alerts
- `omnipost.neuralliquid.ai` hostname binding

The existing App Service managed certificate remains live in Azure. Certificate
lifecycle should be normalized in a later Terraform pass after validating the
provider import behavior.

### App Service Startup Command Configuration (Dec 10, 2024)

**Issue**: Container was terminating during startup because Azure App Service was using default Node.js startup (`npm start`) instead of running the Next.js standalone server.

**Fix**: Explicitly set `appCommandLine: 'node server.js'` in runtime infrastructure for the production app and staging slots.

**Technical Details**:

- Next.js standalone mode creates a minimal `server.js` that must be run directly
- Azure's managed Node.js runtime ignores `WEBSITE_STARTUP_FILE` when `appCommandLine` is empty
- Setting `appCommandLine` explicitly ensures the correct startup command is used
- This was originally fixed in `main.bicep` and is mirrored in Terraform.

## Naming Pattern

All resources follow the pattern:

```
[org]-[env]-[project]-[type]
```

Resource groups use:

```
[org]-[env]-[project]-rg
```

The region is no longer encoded in the resource name. It is expressed by:

- The Azure resource group's `location` property (authoritative)
- The `region` tag on every resource (derived from the `region` parameter)

Multi-region disambiguation, when needed, is handled by deploying into
distinct resource groups (e.g. `nl-prod-omnipost-rg` in `westeurope`
vs a future `nl-prod-omnipost-rg-2` in another region) rather than
embedding the region into every resource name.

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

- `omnipost` - This project (was `content-creation` / `cc` before 2026-05-10)
- `rooivalk` - Counter-UAS platform [^rooivalk]
- `autopr` - Autopr automation platform
- `nl-core` - Shared NL foundation services
- `nl-ai` - Shared NL AI services

[^rooivalk]: `rooivalk` has since been spun out to the Nexamesh org as `nexamesh-core`; the code remains valid for any historical NL-owned resources.

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
nl-dev-omnipost-rg         # Resource Group
nl-dev-omnipost-app        # App Service
nl-dev-omnipost-asp        # App Service Plan
nl-dev-omnipost-api        # API Service
nl-dev-omnipost-db         # Database
```

### Production Environment (South Africa North)

```
nl-prod-omnipost-rg        # Resource Group (location: southafricanorth)
nl-prod-omnipost-app       # App Service
nl-prod-omnipost-asp       # App Service Plan
```

### Staging Environment (West Europe)

```
nl-staging-omnipost-rg     # Resource Group
nl-staging-omnipost-app    # App Service
```

## Usage

### Shell Script (naming.sh)

The `naming.sh` script generates standardized names:

```bash
./infra/naming.sh <org> <env> <project> <region>

# Example:
./infra/naming.sh nl dev omnipost euw
```

The `<region>` argument is still required for backward compatibility but is
no longer encoded in resource names (see ADR-0027). Output (as environment variables):

```bash
RESOURCE_GROUP=nl-dev-omnipost-rg
APP_NAME=nl-dev-omnipost-app
ASP_NAME=nl-dev-omnipost-asp
API_NAME=nl-dev-omnipost-api
FUNC_NAME=nl-dev-omnipost-func
STORAGE_NAME=nl-dev-omnipost-storage
KV_NAME=nl-dev-omnipost-kv
DB_NAME=nl-dev-omnipost-db
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
param project string = 'omnipost'

@description('Region code (kept for tags + future multi-region disambiguation; not used in resource names)')
@allowed(['euw', 'san', 'saf', 'swe', 'eun', 'wus', 'eus', 'uks', 'usw', 'glob'])
param region string = 'euw'

// Generate names directly (available at deployment start)
var base = '${org}-${env}-${project}'
var appName = '${base}-app'
var aspName = '${base}-asp'

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
  PROJECT_NAME: 'omnipost'
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
./infra/naming.sh nl dev omnipost euw  # ✅

# Invalid org code
./infra/naming.sh xyz dev omnipost euw  # ❌ Error

# Invalid environment
./infra/naming.sh nl test omnipost euw  # ❌ Error (should be 'staging')

# Invalid region
./infra/naming.sh nl dev omnipost xyz   # ❌ Error
```

## Migration Notes

### From legacy `cc` + region-suffixed names (2026-05-10)

**Legacy (deployed to dev as `nl-dev-cc-rg-euw`, with parallel
`nl-dev-omnipost-rg-euw`):**

```
nl-dev-cc-rg-euw
nl-dev-cc-app-euw
nl-dev-omnipost-rg-euw       # parallel deploy under new project name
```

**New (per ADR-0027 application; deployed afresh):**

```
nl-dev-omnipost-rg
nl-dev-omnipost-app
```

**Changes:**

1. Project code consolidated: `cc` (and the parallel `omnipost`) → `omnipost`
2. Region suffix dropped from resource names (region is on the resource group's
   `location` property and on the `region` resource tag)

**Cutover:** the legacy `nl-dev-cc-rg-euw` and the parallel
`nl-dev-omnipost-rg-euw` are decommissioned in a separate manual ops step
once the new `nl-dev-omnipost-rg` deploy is healthy. Neither legacy RG had a
custom domain, so DNS migration is not required.

### Earlier (pre-NL-standards)

**Pre-standard:**

```
dev-euw-rg-content-creation
dev-euw-app-content-creation
```

**NL-standard with region suffix (intermediate):**

```
nl-dev-content-creation-rg-euw
nl-dev-content-creation-app-euw
```

**Current (this doc):**

```
nl-dev-omnipost-rg
nl-dev-omnipost-app
```

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
  "project": "omnipost",
  "region": "euw",
  "managedBy": "bicep"
}
```

The `region` tag is the canonical place to read the deployment region from a
resource (in addition to the resource group's `location` property), since it
is no longer in the resource name itself.

## References

- Full standard: See main Azure naming conventions documentation
- Bicep module: `infra/naming.bicep`
- Shell script: `infra/naming.sh`
- Workflow: `.github/workflows/azure-webapps-node.yml`
