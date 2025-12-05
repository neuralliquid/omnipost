# Deployment Technology Stack

> **Layer**: Deployments & Ops
> **Technologies**: Azure Web Apps, Bicep IaC, GitHub Actions CI/CD
> **Last Updated**: December 2025

---

## Overview

The Content Creation Platform is deployed to Azure Web Apps using infrastructure-as-code (Bicep) and automated CI/CD pipelines via GitHub Actions. The deployment supports multiple environments with environment-specific configurations.

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   GitHub    │────▶│   GitHub    │────▶│   Azure     │       │
│  │   Push      │     │   Actions   │     │   Web App   │       │
│  └─────────────┘     └─────────────┘     └─────────────┘       │
│        │                   │                    │               │
│        │                   ▼                    │               │
│        │           ┌─────────────┐              │               │
│        │           │   Bicep     │──────────────┘               │
│        │           │   Deploy    │                              │
│        │           └─────────────┘                              │
│        │                                                        │
│        ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    CI PIPELINE                           │   │
│  │  Install → Type Check → Test → Format → Build           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Azure Infrastructure

### Azure Web Apps

| Setting | Value |
|---------|-------|
| **Runtime** | Node.js 20 LTS |
| **OS** | Linux |
| **SKU** | B1 (configurable) |
| **Region** | West Europe (default) |
| **TLS** | 1.2 minimum |
| **HTTP/2** | Enabled |
| **Always On** | Enabled |

### Bicep Template

**Location:** `infra/main.bicep`

```bicep
@description('The name of the web app to create')
param appName string

@description('The location to deploy the resources')
param location string = resourceGroup().location

@description('The SKU of the app service plan')
@allowed(['B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1v2', 'P2v2', 'P3v2'])
param sku string = 'B1'

@description('The runtime stack of the web app')
param linuxFxVersion string = 'NODE|20-lts'

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${appName}-asp'
  location: location
  sku: { name: sku }
  kind: 'linux'
  properties: { reserved: true }
}

resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: appName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      appSettings: [
        { name: 'SCM_DO_BUILD_DURING_DEPLOYMENT', value: 'true' },
        { name: 'WEBSITE_NODE_DEFAULT_VERSION', value: '~20' },
        { name: 'ENVIRONMENT', value: split(appName, '-')[0] },
      ]
    }
  }
}

output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
```

### Resource Naming

**Script:** `infra/naming.sh`

```bash
# Generates standardized resource names
# Format: {env}-{region}-{project}-{resource}
# Example: dev-euw-content-creation-app
```

| Resource | Naming Pattern |
|----------|----------------|
| Resource Group | `{env}-{region}-{project}-rg` |
| App Service Plan | `{env}-{region}-{project}-asp` |
| Web App | `{env}-{region}-{project}-app` |

---

## CI/CD Pipelines

### CI Workflow

**Location:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run type-check
      - run: npm test
        env:
          JWT_SECRET: test-secret-key-for-ci
      - run: npm run format:check

  build:
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          JWT_SECRET: test-secret-key-for-ci
```

### Deployment Workflow

**Location:** `.github/workflows/azure-webapps-node.yml`

```yaml
name: Azure Web App - Node.js CI/CD

on:
  push:
    branches: ["main"]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'dev'
        type: choice
        options: [dev, test, prod]

env:
  NODE_VERSION: '20.x'
  AZURE_WEBAPP_PACKAGE_PATH: '.'
  PROJECT_NAME: 'content-creation'
  LOCATION_CODE: 'euw'
  LOCATION: 'westeurope'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install && npm run build && npm run test
      - run: zip -r node-app.zip ./*
      - uses: actions/upload-artifact@v4
        with:
          name: node-app
          path: node-app.zip

  infrastructure:
    runs-on: ubuntu-latest
    needs: build
    environment: ${{ github.event.inputs.environment || 'dev' }}
    steps:
      - uses: actions/checkout@v4
      - name: Generate Resource Names
        run: ./infra/naming.sh ${{ env.ENVIRONMENT }} ${{ env.LOCATION_CODE }} ${{ env.PROJECT_NAME }}
      - uses: azure/login@v1
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
      - name: Create Resource Group
        run: az group create --name ${{ env.RESOURCE_GROUP }} --location ${{ env.LOCATION }}
      - uses: azure/arm-deploy@v1
        with:
          resourceGroupName: ${{ env.RESOURCE_GROUP }}
          template: ./infra/main.bicep
          parameters: appName=${{ env.APP_NAME }} location=${{ env.LOCATION }}

  deploy:
    runs-on: ubuntu-latest
    needs: infrastructure
    environment:
      name: ${{ github.event.inputs.environment || 'dev' }}
      url: ${{ steps.deploy-to-webapp.outputs.webapp-url }}
    steps:
      - uses: actions/download-artifact@v4
      - run: unzip node-app.zip
      - uses: azure/login@v1
      - uses: azure/webapps-deploy@v3
        with:
          app-name: ${{ env.APP_NAME }}
          package: ${{ env.AZURE_WEBAPP_PACKAGE_PATH }}
```

---

## Environments

### Environment Configuration

| Environment | Trigger | Purpose |
|-------------|---------|---------|
| **Development** | Manual dispatch | Feature development |
| **Test** | Manual dispatch | QA testing |
| **Production** | Push to main | Live users |

### Environment Variables

**Required (All Environments):**
```bash
JWT_SECRET=<secure-random-string>
```

**Optional (Feature-dependent):**
```bash
# AI Services
HUGGING_FACE_API_KEY=<key>

# Data Storage
AIRTABLE_API_KEY=<key>
AIRTABLE_BASE_ID=<id>

# Notifications
SLACK_TOKEN=<token>
TWILIO_ACCOUNT_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
EMAIL_USER=<email>
```

### GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `AZURE_CLIENT_ID` | Azure service principal |
| `AZURE_TENANT_ID` | Azure AD tenant |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription |
| `JWT_SECRET` | JWT signing (CI) |

---

## Pipeline Stages

### CI Pipeline Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Install   │────▶│ Type Check  │────▶│    Test     │
│   (npm ci)  │     │ (tsc)       │     │   (jest)    │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
┌─────────────┐     ┌─────────────┐           │
│    Build    │◀────│   Format    │◀──────────┘
│ (next build)│     │ (prettier)  │
└─────────────┘     └─────────────┘
```

### Deployment Pipeline Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Build    │────▶│   Infra     │────▶│   Deploy    │
│  (artifact) │     │  (bicep)    │     │  (webapp)   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      ▼                   ▼                   ▼
 node-app.zip      Azure Resources      Running App
```

---

## Build Configuration

### Next.js Build

```bash
npm run build
```

**Output:**
- `.next/` directory with optimized production build
- Static assets in `.next/static/`
- Server bundles in `.next/server/`

### Build Scripts

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start",
    "export": "next export",
    "deploy": "npm run build && npm run export"
  }
}
```

---

## Monitoring & Observability

### Current State

| Feature | Status | Notes |
|---------|--------|-------|
| Application Insights | ❌ Not configured | Planned |
| Health endpoint | ❌ Not implemented | Recommended |
| Log aggregation | ❌ Console only | Azure logs available |
| Alerting | ❌ Not configured | Recommended |
| Performance monitoring | ❌ Not configured | Recommended |

### Planned Additions

```bicep
// Future: Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-ai'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Request_Source: 'rest'
  }
}
```

---

## Deployment Checklist

### Pre-deployment

- [ ] All tests passing
- [ ] Type check passes
- [ ] Format check passes
- [ ] No high/critical vulnerabilities
- [ ] Environment variables configured
- [ ] Secrets in GitHub configured

### Post-deployment

- [ ] Health check passes (if implemented)
- [ ] Key features functional
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Monitoring active (if configured)

---

## Rollback Strategy

### Current Approach

1. Revert commit on main branch
2. Pipeline triggers new deployment
3. Previous version deployed

### Recommended Approach

1. Use Azure deployment slots
2. Swap slots for instant rollback
3. Keep previous deployment warm

---

## Infrastructure Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                         AZURE                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Resource Group                         │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              App Service Plan                       │  │  │
│  │  │  ┌──────────────────────────────────────────────┐  │  │  │
│  │  │  │              Web App                         │  │  │  │
│  │  │  │  • Node.js 20 LTS                           │  │  │  │
│  │  │  │  • Linux container                          │  │  │  │
│  │  │  │  • TLS 1.2+                                 │  │  │  │
│  │  │  │  • HTTP/2 enabled                           │  │  │  │
│  │  │  └──────────────────────────────────────────────┘  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐                  │
│  │   Key Vault      │    │  App Insights    │                  │
│  │   (planned)      │    │   (planned)      │                  │
│  └──────────────────┘    └──────────────────┘                  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                        EXTERNAL                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Airtable   │  │ Hugging Face │  │  Notification APIs   │  │
│  │              │  │              │  │  (Slack, Twilio,     │  │
│  │              │  │              │  │   Gmail)             │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Best Practices Compliance

| Practice | Status | Notes |
|----------|--------|-------|
| Infrastructure as Code | ✅ | Bicep templates |
| CI/CD automation | ✅ | GitHub Actions |
| Environment separation | ✅ | dev/test/prod |
| Secrets management | ⚠️ | GitHub secrets (not Key Vault) |
| Build verification | ✅ | Tests required before deploy |
| Artifact management | ✅ | Upload/download artifacts |
| Health checks | ❌ | Not implemented |
| Monitoring | ❌ | Not configured |
| Alerting | ❌ | Not configured |
| Blue-green deployment | ❌ | Single slot only |

---

## Recommendations

### Short-term
1. Add health check endpoint (`/api/health`)
2. Configure Application Insights
3. Add deployment slot for staging

### Medium-term
1. Move secrets to Azure Key Vault
2. Implement blue-green deployments
3. Add performance monitoring

### Long-term
1. Consider Azure Front Door for CDN/WAF
2. Implement auto-scaling rules
3. Add disaster recovery strategy

---

*This document details the deployment technology stack for the Content Creation Platform.*
