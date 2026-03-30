// Sluice AI Gateway Infrastructure
// Deploys an Azure Container App running the Sluice OpenAI-compatible gateway
// for centralized AI request routing, cost tracking, and model abstraction.
//
// Prerequisites:
//   - Container App Environment (created in main.bicep or shared)
//   - Key Vault with AI provider secrets
//   - Log Analytics workspace for monitoring
//
// @see https://github.com/phoenixvc/sluice

@description('Organisation code')
@allowed(['nl', 'pvc', 'tws', 'mys'])
param org string = 'nl'

@description('Environment (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param env string = 'dev'

@description('Project name')
param project string = 'omnipost'

@description('Region code')
@allowed(['euw', 'eun', 'wus', 'eus', 'san', 'saf', 'swe', 'uks', 'usw', 'glob'])
param region string = 'euw'

@description('The location to deploy the resources')
param location string = resourceGroup().location

@description('Sluice container image')
param sluiceImage string = 'ghcr.io/phoenixvc/sluice:latest'

@description('Azure OpenAI endpoint URL')
@secure()
param azureOpenAIEndpoint string

@description('Azure OpenAI API key')
@secure()
param azureOpenAIApiKey string

@description('Sluice gateway API key for authentication')
@secure()
param sluiceApiKey string

// Naming convention: [org]-[env]-[project]-[type]-[region]
var base = '${org}-${env}-${project}'
var containerAppEnvName = '${base}-cae-${region}'
var containerAppName = '${base}-sluice-${region}'
var logAnalyticsName = '${base}-log-${region}'

// Reference existing Log Analytics workspace (created by monitoring.bicep)
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: logAnalyticsName
}

// Container App Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
  tags: {
    org: org
    environment: env
    project: project
    region: region
    managedBy: 'bicep'
    component: 'sluice-gateway'
  }
}

// Sluice Container App
resource sluiceApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: false // Internal only — accessed by OmniPost app
        targetPort: 4000
        transport: 'http'
      }
      secrets: [
        {
          name: 'azure-openai-endpoint'
          value: azureOpenAIEndpoint
        }
        {
          name: 'azure-openai-api-key'
          value: azureOpenAIApiKey
        }
        {
          name: 'sluice-api-key'
          value: sluiceApiKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'sluice'
          image: sluiceImage
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            {
              name: 'AZURE_OPENAI_ENDPOINT'
              secretRef: 'azure-openai-endpoint'
            }
            {
              name: 'AZURE_OPENAI_API_KEY'
              secretRef: 'azure-openai-api-key'
            }
            {
              name: 'AIGATEWAY_KEY'
              secretRef: 'sluice-api-key'
            }
            {
              name: 'PORT'
              value: '4000'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 4000
              }
              initialDelaySeconds: 5
              periodSeconds: 10
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 4000
              }
              initialDelaySeconds: 3
              periodSeconds: 5
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 3
        rules: [
          {
            name: 'http-requests'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
  tags: {
    org: org
    environment: env
    project: project
    region: region
    managedBy: 'bicep'
    component: 'sluice-gateway'
  }
}

// Outputs
output sluiceAppName string = sluiceApp.name
output sluiceAppFqdn string = sluiceApp.properties.configuration.ingress.fqdn
output sluiceGatewayUrl string = 'http://${sluiceApp.properties.configuration.ingress.fqdn}'
