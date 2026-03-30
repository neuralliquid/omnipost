// Azure Database for PostgreSQL Flexible Server (Free Tier)
// Burstable B1ms SKU with 32GB storage — eligible for Azure free tier
//
// Usage:
//   az deployment group create \
//     --resource-group rg-nl-dev-omnipost-euw \
//     --template-file infra/postgresql.bicep \
//     --parameters org=nl env=dev project=omnipost region=euw administratorLogin=omnipostadmin administratorPassword=<secure>

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

@description('PostgreSQL administrator login name')
@secure()
param administratorLogin string

@description('PostgreSQL administrator password')
@secure()
param administratorPassword string

@description('PostgreSQL version')
@allowed(['14', '15', '16'])
param postgresVersion string = '16'

@description('Database name to create')
param databaseName string = 'omnipost'

@description('Storage size in GB (32GB for free tier)')
@minValue(32)
@maxValue(16384)
param storageSizeGB int = 32

@description('Backup retention days')
@minValue(7)
@maxValue(35)
param backupRetentionDays int = 7

// Naming convention: [org]-[env]-[project]-psql-[region]
var serverName = '${org}-${env}-${project}-psql-${region}'

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: serverName
  location: location
  tags: {
    org: org
    env: env
    project: project
    region: region
    managedBy: 'bicep'
  }
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: postgresVersion
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: storageSizeGB
    }
    backup: {
      backupRetentionDays: backupRetentionDays
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
    network: {
      // Allow Azure services to access the server
      publicNetworkAccess: 'Enabled'
    }
  }
}

// Firewall rule: Allow Azure services
resource allowAzureServices 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: postgresServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Create the application database
resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgresServer
  name: databaseName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

@description('PostgreSQL server FQDN')
output serverFqdn string = postgresServer.properties.fullyQualifiedDomainName

@description('PostgreSQL connection string (without password)')
output connectionString string = 'postgresql://${administratorLogin}@${serverName}:@${postgresServer.properties.fullyQualifiedDomainName}:5432/${databaseName}?sslmode=require'

@description('PostgreSQL server name')
output serverNameOutput string = postgresServer.name

@description('Database name')
output databaseNameOutput string = databaseName
