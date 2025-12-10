# Deployment & Infrastructure Guide

This document describes the deployment process for OmniPost to Azure, including custom domain configuration for `omnipost.nexamesh.ai`.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Overview](#infrastructure-overview)
3. [Deployment Workflows](#deployment-workflows)
4. [Custom Domain Configuration](#custom-domain-configuration)
5. [DNS Setup](#dns-setup)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Azure Requirements

1. **Azure Subscription** with permissions to:
   - Create Resource Groups
   - Deploy App Service Plans and Web Apps
   - Create Application Insights
   - Manage DNS Zones (for custom domains)

2. **Azure Service Principal** with Contributor role:

   ```bash
   az ad sp create-for-rbac --name "omnipost-deploy" \
     --role contributor \
     --scopes /subscriptions/<SUBSCRIPTION_ID> \
     --sdk-auth
   ```

3. **GitHub Secrets** configured:
   - `AZURE_CREDENTIALS`: Service principal JSON from above

### DNS Requirements

- DNS Zone `nexamesh.ai` must exist in Azure DNS
- Zone should be in resource group `rg-dns-global`
- Required permissions to create DNS records

---

## Infrastructure Overview

### Bicep Modules

```
infra/
├── main.bicep           # Main orchestration
├── monitoring.bicep     # Application Insights + Log Analytics
├── dns.bicep            # DNS record configuration
└── custom-domain.bicep  # Custom hostname bindings
```

### Resources Created

| Resource             | Naming Pattern                       | Purpose                     |
| -------------------- | ------------------------------------ | --------------------------- |
| Resource Group       | `{org}-{env}-{project}-rg-{region}`  | Container for all resources |
| App Service Plan     | `{org}-{env}-{project}-asp-{region}` | Hosting plan (Linux)        |
| Web App              | `{org}-{env}-{project}-app-{region}` | Application hosting         |
| Application Insights | `{org}-{env}-{project}-ai-{region}`  | Monitoring                  |
| Log Analytics        | `{org}-{env}-{project}-law-{region}` | Logging                     |

### Environment Configuration

| Parameter        | Dev      | Prod          |
| ---------------- | -------- | ------------- |
| SKU              | B1       | S1            |
| Monitoring       | Yes      | Yes           |
| Deployment Slots | No       | Yes (staging) |
| Custom Domain    | Optional | Yes           |
| SSL              | Managed  | Managed       |

---

## Deployment Workflows

### Available Workflows

1. **`azure-webapps-node.yml`**: Standard CI/CD for dev/test
2. **`deploy-prod.yml`**: Production with DNS configuration

### Standard Deployment

Triggered automatically on push to `main`:

```yaml
# Workflow steps:
1. Build and test application
2. Create deployment package (standalone)
3. Deploy infrastructure (Bicep)
4. Deploy application code
5. Verify health check
```

### Production Deployment

Manual trigger with custom domain option:

```bash
# Via GitHub Actions UI or gh CLI
gh workflow run deploy-prod.yml \
  -f enable_custom_domain=true \
  -f skip_dns_verification=false
```

---

## Custom Domain Configuration

### Domain Structure

| Domain                     | Purpose          |
| -------------------------- | ---------------- |
| `omnipost.nexamesh.ai`     | Main application |
| `api.omnipost.nexamesh.ai` | API endpoint     |

### SSL Certificates

Azure App Service Managed Certificates are automatically provisioned:

1. DNS verification records created automatically
2. Certificate issued within 15-30 minutes
3. Auto-renewal handled by Azure

### Enabling Custom Domain

1. Set `enableCustomDomain=true` in Bicep parameters
2. Run production deployment workflow
3. Wait for DNS propagation (5-30 minutes)
4. SSL certificate provisioning (15-30 minutes)

---

## DNS Setup

### Required DNS Records

| Record Type | Name               | Value                          | TTL  |
| ----------- | ------------------ | ------------------------------ | ---- |
| CNAME       | omnipost           | `{app-name}.azurewebsites.net` | 3600 |
| CNAME       | api.omnipost       | `{app-name}.azurewebsites.net` | 3600 |
| TXT         | asuid.omnipost     | `{app-hostname}`               | 3600 |
| TXT         | asuid.api.omnipost | `{app-hostname}`               | 3600 |

### Manual DNS Configuration

If automatic DNS fails, configure manually:

```bash
# Set variables
DNS_ZONE="nexamesh.ai"
DNS_RG="rg-dns-global"
APP_HOSTNAME="nl-prod-content-creation-app-euw.azurewebsites.net"

# Create CNAME for main app
az network dns record-set cname create \
  --zone-name $DNS_ZONE \
  --resource-group $DNS_RG \
  --name omnipost \
  --ttl 3600

az network dns record-set cname set-record \
  --zone-name $DNS_ZONE \
  --resource-group $DNS_RG \
  --record-set-name omnipost \
  --cname $APP_HOSTNAME

# Create verification TXT record
az network dns record-set txt create \
  --zone-name $DNS_ZONE \
  --resource-group $DNS_RG \
  --name asuid.omnipost \
  --ttl 3600

az network dns record-set txt add-record \
  --zone-name $DNS_ZONE \
  --resource-group $DNS_RG \
  --record-set-name asuid.omnipost \
  --value $APP_HOSTNAME
```

### Verify DNS Propagation

```bash
# Check CNAME resolution
dig +short omnipost.nexamesh.ai

# Check from multiple locations
nslookup omnipost.nexamesh.ai 8.8.8.8
nslookup omnipost.nexamesh.ai 1.1.1.1
```

---

## Troubleshooting

### Common Issues

#### 1. Container Terminating During Startup / 503 Errors

**Symptoms**:

- Health check fails with 503 errors
- Container terminates during startup probe
- Logs show: "Site container terminated during site startup"

**Root Cause**:
Azure App Service on Linux with `NODE|20-lts` runtime defaults to running `npm start` when `appCommandLine` is not explicitly set. For Next.js standalone mode, this fails because:

- `package.json` contains `"start": "next start"`
- The Next.js CLI (`next`) is not available in standalone builds
- The app requires `node server.js` to start the standalone server

**Solution**:
The Bicep template now explicitly sets `appCommandLine: 'node server.js'` in `infra/main.bicep` (lines 88 and 182).

If you encounter this issue:

1. Verify `appCommandLine` is set in your Bicep deployment
2. Redeploy infrastructure: The GitHub Actions workflow will update this automatically
3. Manual fix (temporary):
   ```bash
   az webapp config set --name nl-dev-omnipost-app-euw \
     --resource-group nl-dev-omnipost-rg-euw \
     --startup-file "node server.js"
   ```

**Technical Details**:

- Next.js standalone mode creates a minimal `server.js` with embedded dependencies
- The server expects to be run directly with `node server.js`
- `WEBSITE_STARTUP_FILE` is ignored when using managed Node.js runtime
- `appCommandLine` takes precedence and explicitly sets the startup command

#### 2. DNS Not Resolving

**Symptoms**: `dig` returns no results

**Solutions**:

- Wait longer (up to 48 hours for global propagation)
- Check DNS zone configuration
- Verify CNAME record points to correct hostname

#### 2. SSL Certificate Not Issued

**Symptoms**: HTTPS shows certificate error

**Solutions**:

- Verify TXT verification record exists
- Wait 15-30 minutes after DNS propagation
- Check App Service → Custom domains → Certificate status

#### 3. Health Check Failing

**Symptoms**: Deployment reports health check failure

**Solutions**:

- Check application logs: `az webapp log tail --name <app-name> --resource-group <rg>`
- Verify `startup.sh` is executable
- Check environment variables are set

#### 4. Custom Domain Shows Wrong App

**Symptoms**: Domain shows Azure default page

**Solutions**:

- Verify hostname binding in App Service
- Check CNAME points to YOUR app, not another
- Redeploy with custom domain enabled

### Useful Commands

```bash
# View app logs
az webapp log tail --name nl-prod-content-creation-app-euw \
  --resource-group nl-prod-content-creation-rg-euw

# Check app status
az webapp show --name nl-prod-content-creation-app-euw \
  --resource-group nl-prod-content-creation-rg-euw \
  --query state

# List custom domains
az webapp show --name nl-prod-content-creation-app-euw \
  --resource-group nl-prod-content-creation-rg-euw \
  --query hostNames

# View DNS records
az network dns record-set list --zone-name nexamesh.ai \
  --resource-group rg-dns-global --output table

# Restart app
az webapp restart --name nl-prod-content-creation-app-euw \
  --resource-group nl-prod-content-creation-rg-euw
```

### Support Resources

- [Azure App Service Docs](https://docs.microsoft.com/azure/app-service/)
- [Azure DNS Docs](https://docs.microsoft.com/azure/dns/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

---

## Quick Reference

### URLs

| Environment   | URL                                                          |
| ------------- | ------------------------------------------------------------ |
| Dev           | `https://nl-dev-content-creation-app-euw.azurewebsites.net`  |
| Prod (Azure)  | `https://nl-prod-content-creation-app-euw.azurewebsites.net` |
| Prod (Custom) | `https://omnipost.nexamesh.ai`                               |
| API (Custom)  | `https://api.omnipost.nexamesh.ai`                           |

### Resource Groups

| Environment | Resource Group                    |
| ----------- | --------------------------------- |
| Dev         | `nl-dev-content-creation-rg-euw`  |
| Prod        | `nl-prod-content-creation-rg-euw` |
| DNS         | `rg-dns-global`                   |
