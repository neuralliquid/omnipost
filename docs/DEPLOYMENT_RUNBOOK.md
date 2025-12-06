# Deployment Runbook

## Overview

This runbook provides step-by-step instructions for deploying the Content Creation Platform to Azure App Service, troubleshooting common issues, and performing operational tasks.

## Prerequisites

- Azure CLI installed (`az --version`)
- Azure subscription with appropriate permissions
- GitHub repository access
- pnpm installed locally (for manual deployments)

## Automated Deployment (GitHub Actions)

### Normal Deployment

**Trigger:** Push to `main` branch automatically deploys to **dev** environment.

```bash
git push origin main
```

**Monitor:** https://github.com/JustAGhosT/content_creation/actions

### Manual Deployment to Specific Environment

1. Go to **Actions** → **Azure Web App - Node.js CI/CD**
2. Click **Run workflow**
3. Select environment: `dev`, `test`, or `prod`
4. Click **Run workflow**

### Deployment Stages

1. **Build** (5-7 minutes)
   - Install dependencies
   - Run type-check and lint
   - Build Next.js standalone output
   - Run tests
   - Create deployment package (~86MB)

2. **Infrastructure** (2-3 minutes)
   - Create/update resource group
   - Deploy Bicep templates
   - Configure App Service settings

3. **Deploy** (3-5 minutes)
   - Upload deployment package
   - Extract to Azure
   - Start application
   - Verify health endpoint

**Total time:** ~10-15 minutes

## Manual Deployment

### One-Time Setup

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login to Azure
az login

# Set subscription
az account set --subscription "Your-Subscription-Name"

# Create service principal for deployments
az ad sp create-for-rbac \
  --name "content-creation-deploy" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/nl-dev-content-creation-rg-euw \
  --sdk-auth
```

### Deploy Infrastructure

```bash
cd infra

# Set variables
ORG_CODE="nl"
ENV="dev"
PROJECT="content-creation"
REGION="euw"
LOCATION="westeurope"

# Generate resource names
source naming.sh $ORG_CODE $ENV $PROJECT $REGION

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Deploy Bicep template
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file main.bicep \
  --parameters \
    org=$ORG_CODE \
    env=$ENV \
    project=$PROJECT \
    region=$REGION \
    location=$LOCATION \
    enableMonitoring=true \
    enableDeploymentSlot=false  # true for prod/staging

# Note the outputs (App URL, App Insights connection string, etc.)
```

### Deploy Application Manually

```bash
# From project root
pnpm install --frozen-lockfile
pnpm run type-check
pnpm run lint
pnpm run build

# Create deployment package
mkdir -p deploy
cp -r .next/standalone/. deploy/
mkdir -p deploy/.next/static
cp -r .next/static/. deploy/.next/static/
cp -r public deploy/public
cp startup.sh deploy/
chmod +x deploy/startup.sh

# Create zip
cd deploy && zip -r ../release.zip . && cd ..

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src release.zip

# Verify deployment
curl https://$APP_NAME.azurewebsites.net/api/health
```

## Blue-Green Deployment (Staging Slot)

### Deploy to Staging Slot

```bash
# Deploy to staging slot
az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --slot staging \
  --src release.zip

# Test staging
STAGING_URL=$(az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --slot staging \
  --query "defaultHostName" -o tsv)

curl https://$STAGING_URL/api/health

# If tests pass, swap to production
az webapp deployment slot swap \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --slot staging \
  --target-slot production
```

### Rollback

```bash
# Swap back to previous version
az webapp deployment slot swap \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --slot staging \
  --target-slot production
```

## Troubleshooting

### Issue: App Not Starting

**Symptoms:** Health check fails, HTTP 503 errors

**Diagnosis:**

```bash
# Check app logs
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME

# Check if server.js exists
az webapp ssh \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME

# In SSH session:
ls -la /home/site/wwwroot/
cat /home/site/wwwroot/startup.sh
```

**Common Causes:**

1. Missing `server.js` in standalone build
   - **Fix:** Ensure `output: 'standalone'` is in `next.config.ts`
2. Wrong startup command
   - **Fix:** Verify `WEBSITE_STARTUP_FILE=startup.sh` is set
3. Missing environment variables
   - **Fix:** Configure secrets per [AZURE_SECRETS.md](./AZURE_SECRETS.md)

### Issue: Build Failures

**Symptoms:** CI/CD fails during build step

**Diagnosis:**

```bash
# Run locally
pnpm install --frozen-lockfile
pnpm run type-check  # Check TypeScript errors
pnpm run lint        # Check linting errors
pnpm test            # Check test failures
```

**Common Causes:**

1. TypeScript errors
   - **Fix:** Run `pnpm run type-check` and fix errors
2. Missing dependencies
   - **Fix:** Run `pnpm install` and commit `pnpm-lock.yaml`
3. Test failures
   - **Fix:** Run `pnpm test` locally, fix failing tests

### Issue: Deployment Package Too Large

**Symptoms:** Upload timeout, slow deployments

**Diagnosis:**

```bash
# Check package size
du -sh .next/standalone/
du -sh .next/static/

# Check for unexpected large files
find .next/standalone -type f -size +10M
```

**Fix:**

- Ensure using standalone build (not full node_modules)
- Check for accidentally included large assets
- Expected size: ~80-100MB

### Issue: High Memory Usage

**Symptoms:** App crashes, out of memory errors

**Diagnosis:**

```bash
# Check App Service metrics
az monitor metrics list \
  --resource $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --resource-type "Microsoft.Web/sites" \
  --metric MemoryPercentage \
  --start-time $(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ') \
  --interval PT1M
```

**Fix:**

- Scale up to higher SKU: `az webapp update --resource-group $RESOURCE_GROUP --name $APP_NAME --sku B2`
- Enable Application Insights to identify memory leaks
- Review Next.js memory usage patterns

### Issue: Slow Response Times

**Symptoms:** Health check times out, slow page loads

**Diagnosis:**

```bash
# Check response times
az monitor metrics list \
  --resource $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --resource-type "Microsoft.Web/sites" \
  --metric AverageResponseTime \
  --start-time $(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ') \
  --interval PT1M
```

**Fix:**

- Enable `alwaysOn`: Already enabled in Bicep
- Check for database/API call bottlenecks in Application Insights
- Scale out: Add more instances

### Issue: Authentication Failures

**Symptoms:** 401 Unauthorized errors

**Diagnosis:**

```bash
# Check if JWT_SECRET is set
az webapp config appsettings list \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --query "[?name=='JWT_SECRET']"
```

**Fix:**

```bash
# Generate and set JWT_SECRET
JWT_SECRET=$(openssl rand -base64 32)
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings JWT_SECRET="$JWT_SECRET"

# Restart app
az webapp restart \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME
```

## Operational Tasks

### View Logs

```bash
# Real-time logs
az webapp log tail \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME

# Download logs
az webapp log download \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --log-file app-logs.zip
```

### Restart App

```bash
az webapp restart \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME
```

### Update App Settings

```bash
# Add/update setting
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings SETTING_NAME="value"

# Delete setting
az webapp config appsettings delete \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --setting-names SETTING_NAME
```

### Scale Up/Out

```bash
# Scale up (bigger instance)
az appservice plan update \
  --resource-group $RESOURCE_GROUP \
  --name $ASP_NAME \
  --sku P1v2

# Scale out (more instances)
az appservice plan update \
  --resource-group $RESOURCE_GROUP \
  --name $ASP_NAME \
  --number-of-workers 3
```

### Enable/Disable Monitoring

```bash
# Enable Application Insights
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file infra/main.bicep \
  --parameters enableMonitoring=true

# Connection string is in outputs
```

### Configure Custom Domain

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group $RESOURCE_GROUP \
  --webapp-name $APP_NAME \
  --hostname example.com

# Enable HTTPS
az webapp config ssl bind \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --certificate-thumbprint {thumbprint} \
  --ssl-type SNI
```

## Monitoring & Alerts

### View Application Insights

```bash
# Get Application Insights resource
AI_NAME=$(az resource list \
  --resource-group $RESOURCE_GROUP \
  --resource-type "Microsoft.Insights/components" \
  --query "[0].name" -o tsv)

# Open in portal
az monitor app-insights component show \
  --resource-group $RESOURCE_GROUP \
  --app $AI_NAME
```

**Portal URL:** https://portal.azure.com → Search for `$AI_NAME`

### Query Logs

```bash
# Query failed requests
az monitor app-insights query \
  --app $AI_NAME \
  --analytics-query "requests | where success == false | take 10"

# Query exceptions
az monitor app-insights query \
  --app $AI_NAME \
  --analytics-query "exceptions | take 10"
```

### Configure Alerts

Alerts are automatically created by the Bicep template:

- **High 5xx Errors:** > 10 errors in 5 minutes
- **High Response Time:** > 2 seconds average over 15 minutes
- **High Memory:** > 80% over 15 minutes

**Customize alerts:** Edit `infra/monitoring.bicep` and redeploy.

## Emergency Procedures

### Complete Outage

1. **Check Azure status:** https://status.azure.com/
2. **Check logs:** `az webapp log tail ...`
3. **Restart app:** `az webapp restart ...`
4. **Rollback if needed:** Use staging slot swap
5. **Contact support:** If Azure issue, open support ticket

### Data Loss Prevention

- **Before major changes:** Take App Service backup
- **Regular backups:** Configure automated backups in Azure Portal
- **Test restore:** Periodically test backup restoration

### Incident Response Checklist

- [ ] Identify issue (logs, metrics, alerts)
- [ ] Assess impact (users affected, severity)
- [ ] Communicate (status page, team notification)
- [ ] Implement fix (restart, rollback, hotfix)
- [ ] Verify resolution (health check, manual testing)
- [ ] Post-mortem (root cause, preventive measures)

## References

- **Azure Secrets Configuration:** [AZURE_SECRETS.md](./AZURE_SECRETS.md)
- **Architecture Documentation:** [ARCHITECTURE.md](./ARCHITECTURE.md)
- **API Documentation:** [api/README.md](./api/README.md)
- **Azure CLI Reference:** https://docs.microsoft.com/cli/azure/
- **Next.js Standalone Mode:** https://nextjs.org/docs/advanced-features/output-file-tracing

## Support Contacts

- **Azure Support:** https://azure.microsoft.com/support/
- **Team Lead:** [Contact Information]
- **On-Call:** [Rotation Schedule]
