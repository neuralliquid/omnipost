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

// Use naming module to generate standardized names
module naming 'naming.bicep' = {
  name: 'naming'
  params: {
    org: org
    env: env
    project: project
    region: region
  }
}

// Get standardized names from naming module
var appName = naming.outputs.name_app
var appServicePlanName = naming.outputs.name_asp
var tags = naming.outputs.tags

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
      appSettings: [
        {
          name: 'SCM_DO_BUILD_DURING_DEPLOYMENT'
          value: 'true'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
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
