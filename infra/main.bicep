@description('Organisation code (nl, pvc, tws, mys)')
@allowed(['nl', 'pvc', 'tws', 'mys'])
param org string = 'nl'

@description('Environment (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param env string = 'dev'

@description('Project name')
param project string = 'omnipost'

@description('Region code (euw, san, saf, swe, etc.)')
@allowed(['euw', 'eun', 'wus', 'eus', 'san', 'saf', 'swe', 'uks', 'usw', 'glob'])
param region string = 'euw'

@description('The location to deploy the resources')
param location string = resourceGroup().location

@description('The SKU of the app service plan')
@allowed(['B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1v2', 'P2v2', 'P3v2'])
param sku string = 'B1'

@description('The runtime stack of the web app')
param linuxFxVersion string = 'NODE|20-lts'

@description('Enable Application Insights monitoring')
param enableMonitoring bool = true

@description('Enable deployment slot for blue-green deployments (staging/prod only)')
param enableDeploymentSlot bool = false

@description('Enable custom domain configuration')
param enableCustomDomain bool = false

@description('DNS Zone name')
param dnsZoneName string = 'nexamesh.ai'

@description('DNS Zone resource group')
param dnsZoneResourceGroup string = 'rg-dns-global'

@description('Application subdomain')
param appSubdomain string = 'omnipost'

@description('API subdomain')
param apiSubdomain string = 'api.omnipost'

// Generate names directly (required for resource names - must be available at deployment start)
var base = '${org}-${env}-${project}'
var appName = '${base}-app-${region}'
var appServicePlanName = '${base}-asp-${region}'

// Generate tags
var tags = {
  org: org
  environment: env
  project: project
  region: region
  managedBy: 'bicep'
}

resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: sku
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

resource webApp 'Microsoft.Web/sites@2022-09-01' = {
  name: appName
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned' // Enable managed identity for Key Vault access
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      appCommandLine: 'node server.js'
      httpLoggingEnabled: true
      detailedErrorLoggingEnabled: true
      appSettings: [
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'false' // Stateless deployment - no persistent /home storage needed
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        // IMPORTANT: Application secrets (JWT_SECRET, API keys) must be configured separately
        // See docs/AZURE_SECRETS.md for configuration instructions
        // Use Azure Portal or: az webapp config appsettings set --settings JWT_SECRET="..."
        {
          name: 'PORT'
          value: '8080'
        }
        {
          name: 'WEBSITES_PORT'
          value: '8080'
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1' // Run from package for faster cold starts
        }
        {
          name: 'ENABLE_ORYX_BUILD'
          value: 'false'
        }
        {
          name: 'WEBSITE_HTTPLOGGING_RETENTION_DAYS'
          value: '7'
        }
        {
          name: 'WEBSITE_STARTUP_FILE'
          value: 'startup.sh'
        }
        {
          name: 'ENVIRONMENT'
          value: env
        }
        {
          name: 'ORG'
          value: org
        }
        {
          name: 'PROJECT'
          value: project
        }
      ]
    }
  }
}

// Deploy monitoring module (Application Insights + Log Analytics) after webapp
module monitoring 'monitoring.bicep' = if (enableMonitoring) {
  name: 'monitoring-deployment'
  params: {
    org: org
    env: env
    project: project
    region: region
    location: location
    tags: tags
    webAppId: webApp.id
  }
}

// Deployment slot for staging (blue-green deployment pattern)
resource stagingSlot 'Microsoft.Web/sites/slots@2022-09-01' = if (enableDeploymentSlot) {
  parent: webApp
  name: 'staging'
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned' // Enable managed identity
  }
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      appCommandLine: 'node server.js'
      httpLoggingEnabled: true
      detailedErrorLoggingEnabled: true
      // Inherit app settings from production slot
    }
  }
}

// Get DNS zone information (deployed to current resource group scope)
module dns 'dns.bicep' = if (enableCustomDomain) {
  name: 'dns-info'
  params: {
    dnsZoneName: dnsZoneName
    dnsZoneResourceGroup: dnsZoneResourceGroup
  }
}

// Deploy DNS records to DNS zone resource group
module dnsRecords 'dns-records.bicep' = if (enableCustomDomain) {
  name: 'dns-records-deployment'
  scope: resourceGroup(dnsZoneResourceGroup)
  params: {
    dnsZoneName: dnsZoneName
    appSubdomain: appSubdomain
    apiSubdomain: apiSubdomain
    webAppDefaultHostname: webApp.properties.defaultHostName
    tags: tags
  }
}

// Custom domain binding for main app (omnipost.nexamesh.ai)
module appCustomDomain 'custom-domain.bicep' = if (enableCustomDomain) {
  name: 'app-custom-domain-deployment'
  params: {
    webAppName: webApp.name
    customHostname: '${appSubdomain}.${dnsZoneName}'
    enableSsl: true
    tags: tags
  }
  dependsOn: [
    dnsRecords
  ]
}

// Custom domain binding for API (api.omnipost.nexamesh.ai)
module apiCustomDomain 'custom-domain.bicep' = if (enableCustomDomain) {
  name: 'api-custom-domain-deployment'
  params: {
    webAppName: webApp.name
    customHostname: '${apiSubdomain}.${dnsZoneName}'
    enableSsl: true
    tags: tags
  }
  dependsOn: [
    dnsRecords
  ]
}

output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output appServicePlanName string = appServicePlan.name
output stagingSlotUrl string = enableDeploymentSlot ? 'https://${stagingSlot!.properties.defaultHostName}' : 'N/A'

// Custom domain outputs
output customDomainUrl string = enableCustomDomain ? 'https://${appSubdomain}.${dnsZoneName}' : 'N/A'
output apiCustomDomainUrl string = enableCustomDomain ? 'https://${apiSubdomain}.${dnsZoneName}' : 'N/A'

// Monitoring outputs
output appInsightsConnectionString string = enableMonitoring ? monitoring!.outputs.connectionString : ''
output appInsightsInstrumentationKey string = enableMonitoring ? monitoring!.outputs.instrumentationKey : ''

