@description('Organisation code (nl, pvc, tws, mys)')
@allowed(['nl', 'pvc', 'tws', 'mys'])
param org string = 'nl'

@description('Environment (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param env string = 'dev'

@description('Project name')
param project string = 'content-creation'

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

// Deploy naming module for validation and reference
// Note: Module outputs cannot be used in resource names (BCP120), but can be used in outputs
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
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: linuxFxVersion
      alwaysOn: true
      http20Enabled: true
      minTlsVersion: '1.2'
      appCommandLine: ''
      httpLoggingEnabled: true
      detailedErrorLoggingEnabled: true
      appSettings: [
        {  
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'false'
        }
        {
          name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'
          value: 'true'
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
          value: '0'
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

output webAppName string = webApp.name
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output appServicePlanName string = appServicePlan.name

// Validation outputs from naming module
output namingValidation object = {
  expectedAppName: naming.outputs.name_app
  actualAppName: appName
  expectedAspName: naming.outputs.name_asp
  actualAspName: appServicePlanName
  matches: naming.outputs.name_app == appName && naming.outputs.name_asp == appServicePlanName
}
