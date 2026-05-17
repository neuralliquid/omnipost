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

@description('JWT secret value (must be provided at deployment time)')
@secure()
param jwtSecretValue string

@description('JWT secret expiration (defaults to 1 year from deployment)')
param jwtSecretExpirationEpoch int = dateTimeToEpoch(dateTimeAdd(utcNow(), 'P1Y'))

// Generate Key Vault name (max 24 chars, alphanumeric + hyphens)
// Region suffix dropped per ADR-0027; region param retained for tags/future multi-region
var base = '${org}-${env}-${project}'
var kvName = '${base}-kv'

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
    enableRbacAuthorization: true // Enable RBAC for enhanced security
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

// JWT secret with 1-year expiration (CKV_AZURE_41 compliance)
resource jwtSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'JWT-SECRET'
  properties: {
    value: jwtSecretValue
    attributes: {
      exp: jwtSecretExpirationEpoch
    }
    contentType: 'text/plain'
  }
}

output keyVaultName string = keyVault.name
output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri
