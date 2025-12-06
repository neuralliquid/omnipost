# Azure App Settings Configuration Guide

This document explains how to configure environment variables and secrets for the Azure App Service deployment.

## Overview

The application requires several environment variables and secrets to function properly. These are configured as **Azure App Settings** in the App Service, which become environment variables at runtime.

## Required Secrets

### 🔐 Critical (Required for Core Functionality)

#### JWT_SECRET
- **Purpose:** Signs and verifies JWT authentication tokens
- **Type:** Random string (min 32 characters)
- **How to Generate:**
  ```bash
  # Generate a secure random string
  openssl rand -base64 32
  ```
- **How to Set:**
  ```bash
  az webapp config appsettings set \
    --name nl-dev-content-creation-app-euw \
    --resource-group nl-dev-content-creation-rg-euw \
    --settings JWT_SECRET="your-generated-secret-here"
  ```

## Optional Integration Secrets

Configure these only if you're using the respective integrations:

### Airtable (Content Storage)
```bash
az webapp config appsettings set \
  --name nl-dev-content-creation-app-euw \
  --resource-group nl-dev-content-creation-rg-euw \
  --settings \
    AIRTABLE_API_KEY="your-api-key" \
    AIRTABLE_BASE_ID="your-base-id" \
    AIRTABLE_TABLE_NAME="your-table-name"
```

### Hugging Face (AI Image Generation)
```bash
az webapp config appsettings set \
  --name nl-dev-content-creation-app-euw \
  --resource-group nl-dev-content-creation-rg-euw \
  --settings HUGGING_FACE_API_KEY="your-api-key"
```

### Email (Gmail SMTP)
```bash
az webapp config appsettings set \
  --name nl-dev-content-creation-app-euw \
  --resource-group nl-dev-content-creation-rg-euw \
  --settings \
    EMAIL_USER="your-email@gmail.com" \
    GMAIL_CLIENT_ID="your-client-id" \
    GMAIL_CLIENT_SECRET="your-client-secret" \
    GMAIL_REFRESH_TOKEN="your-refresh-token"
```

### Slack Notifications
```bash
az webapp config appsettings set \
  --name nl-dev-content-creation-app-euw \
  --resource-group nl-dev-content-creation-rg-euw \
  --settings SLACK_TOKEN="xoxb-your-slack-bot-token"
```

### Twilio (SMS Notifications)
```bash
az webapp config appsettings set \
  --name nl-dev-content-creation-app-euw \
  --resource-group nl-dev-content-creation-rg-euw \
  --settings \
    TWILIO_ACCOUNT_SID="your-account-sid" \
    TWILIO_AUTH_TOKEN="your-auth-token" \
    TWILIO_PHONE_NUMBER="+1234567890"
```

### Social Media Platform APIs
```bash
# Facebook
az webapp config appsettings set \
  --name nl-dev-content-creation-app-euw \
  --resource-group nl-dev-content-creation-rg-euw \
  --settings \
    FACEBOOK_API_URL="https://graph.facebook.com" \
    FACEBOOK_API_KEY="your-api-key"

# Instagram
az webapp config appsettings set \
  --name nl-dev-content-creation-app-euw \
  --resource-group nl-dev-content-creation-rg-euw \
  --settings \
    INSTAGRAM_API_URL="https://graph.instagram.com" \
    INSTAGRAM_API_KEY="your-api-key"

# LinkedIn
az webapp config appsettings set \
  --name nl-dev-content-creation-app-euw \
  --resource-group nl-dev-content-creation-rg-euw \
  --settings \
    LINKEDIN_API_URL="https://api.linkedin.com" \
    LINKEDIN_API_KEY="your-api-key"

# Twitter/X
az webapp config appsettings set \
  --name nl-dev-content-creation-app-euw \
  --resource-group nl-dev-content-creation-rg-euw \
  --settings \
    TWITTER_API_URL="https://api.twitter.com" \
    TWITTER_API_KEY="your-api-key"
```

## Configuration via Azure Portal

Alternatively, you can configure these via the Azure Portal:

1. Navigate to your App Service: `nl-dev-content-creation-app-euw`
2. Go to **Settings** → **Configuration**
3. Click **+ New application setting**
4. Add each setting with its value
5. Click **Save** and restart the app

## Using Azure Key Vault (Recommended for Production)

For production environments, store secrets in Azure Key Vault and reference them in App Settings:

1. **Create secrets in Key Vault:**
   ```bash
   az keyvault secret set \
     --vault-name nl-prod-content-creation-kv-euw \
     --name JWT-SECRET \
     --value "your-secret-value"
   ```

2. **Reference in App Settings:**
   ```bash
   az webapp config appsettings set \
     --name nl-prod-content-creation-app-euw \
     --resource-group nl-prod-content-creation-rg-euw \
     --settings JWT_SECRET="@Microsoft.KeyVault(VaultName=nl-prod-content-creation-kv-euw;SecretName=JWT-SECRET)"
   ```

3. **Grant App Service access to Key Vault:**
   ```bash
   # Enable managed identity
   az webapp identity assign \
     --name nl-prod-content-creation-app-euw \
     --resource-group nl-prod-content-creation-rg-euw
   
   # Get the principal ID
   PRINCIPAL_ID=$(az webapp identity show \
     --name nl-prod-content-creation-app-euw \
     --resource-group nl-prod-content-creation-rg-euw \
     --query principalId -o tsv)
   
   # Grant access to Key Vault
   az keyvault set-policy \
     --name nl-prod-content-creation-kv-euw \
     --object-id $PRINCIPAL_ID \
     --secret-permissions get list
   ```

## Verification

After setting secrets, verify they're available:

```bash
# List all app settings
az webapp config appsettings list \
  --name nl-dev-content-creation-app-euw \
  --resource-group nl-dev-content-creation-rg-euw \
  --query "[].{Name:name, Value:value}" \
  --output table

# Test the health endpoint
curl https://nl-dev-content-creation-app-euw.azurewebsites.net/api/health
```

## GitHub Secrets for CI/CD

The deployment pipeline needs these secrets configured in GitHub:

1. Go to **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:
   - `AZURE_CREDENTIALS` - Service principal credentials for Azure login
   - `JWT_SECRET` - For running tests in CI (can be a test value)

## Security Best Practices

- ✅ **Never commit secrets to git** - Always use `.env.local` locally
- ✅ **Rotate secrets regularly** - Especially JWT_SECRET and API keys
- ✅ **Use Key Vault for production** - App Settings are fine for dev/staging
- ✅ **Limit access** - Use managed identities and minimal permissions
- ✅ **Monitor access logs** - Review Key Vault audit logs regularly

## Troubleshooting

### "Unauthorized" errors
- Verify JWT_SECRET is set and matches between environments
- Check App Service logs: `az webapp log tail --name <app-name> --resource-group <rg-name>`

### API integration failures
- Verify the specific API key is set (check logs for which integration failed)
- Test the API key directly using curl or Postman
- Ensure the API URL is correct for your region

### Secrets not loading
- Restart the App Service after changing settings
- Check for typos in secret names (they're case-sensitive in code)
- Verify managed identity has Key Vault access (if using Key Vault references)

## Reference

See [`.env.example`](../.env.example) for the complete list of supported environment variables.
