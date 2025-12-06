// Key Vault Module for Secrets Management
// Provides secure storage for application secrets (JWT tokens, API keys, etc.)

@description('Organisation code')
param org string

@description('Environment')
param env string

@description('Project name')
param project string

@description('Region code')
param region string

@description('The location to deploy the Key Vault')
param location string = resourceGroup().location

@description('Azure AD Tenant ID for access policies')
param tenantId string = subscription().tenantId

@description('Object ID of the service principal or user that needs access')
param principalId string

@description('Tags to apply to resources')
param tags object = {}

// Generate Key Vault name (max 24 chars, alphanumeric + hyphens)
var base = '${org}-${env}-${project}'
var kvName = '${base}-kv-${region}'

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: tenantId
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enableRbacAuthorization: false
    accessPolicies: [
      {
        tenantId: tenantId
        objectId: principalId
        permissions: {
          secrets: [
            'get'
            'list'
          ]
        }
      }
    ]
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// Placeholder secrets - these should be set manually or via pipeline
resource jwtSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'JWT-SECRET'
  properties: {
    value: 'REPLACE-WITH-ACTUAL-SECRET' // This should be replaced via pipeline or manually
    contentType: 'text/plain'
  }
}

output keyVaultName string = keyVault.name
output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri
