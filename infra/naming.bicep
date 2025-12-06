// Azure Naming Convention Module
// Generates standardized resource names following [org]-[env]-[project]-[type]-[region] pattern
// Based on NeuralLiquid Azure Naming Standards v2.1
//
// IMPORTANT: This module can be used for validation but outputs CANNOT be used directly
// in resource name properties due to Bicep limitation BCP120 (module outputs not available
// at deployment start). Use the same variable pattern in your main template instead.
//
// Example usage:
//   var base = '${org}-${env}-${project}'
//   var appName = '${base}-app-${region}'

@description('Owning organisation code')
@allowed([
  'nl'
  'pvc'
  'tws'
  'mys'
])
param org string

@description('Deployment environment')
@allowed([
  'dev'
  'staging'
  'prod'
])
param env string

@description('Logical project / system name')
param project string

@description('Short region code')
@allowed([
  'euw'
  'eun'
  'wus'
  'eus'
  'san'
  'saf'
  'swe'
  'uks'
  'usw'
  'glob'
])
param region string

// Base naming pattern: [org]-[env]-[project]
var base = '${org}-${env}-${project}'

// Resource Group: [org]-[env]-[project]-rg-[region]
output rgName string = '${base}-rg-${region}'

// Compute Resources
output name_app string = '${base}-app-${region}'
output name_api string = '${base}-api-${region}'
output name_func string = '${base}-func-${region}'
output name_swa string = '${base}-swa-${region}'
output name_asp string = '${base}-asp-${region}'

// Data Resources
output name_db string = '${base}-db-${region}'
output name_storage string = '${base}-storage-${region}'
output name_cache string = '${base}-cache-${region}'
output name_queue string = '${base}-queue-${region}'

// Security Resources
output name_kv string = '${base}-kv-${region}'

// AI Resources
output name_ai string = '${base}-ai-${region}'

// Networking Resources
output name_vnet string = '${base}-vnet-${region}'
output name_subnet string = '${base}-subnet-${region}'
output name_dns string = '${base}-dns-${region}'

// Monitoring Resources
output name_log string = '${base}-log-${region}'

// Container Resources
output name_acr string = '${base}-acr-${region}'

// Metadata outputs
output base string = base
output fullPattern string = '[org]-[env]-[project]-[type]-[region]'
output tags object = {
  org: org
  environment: env
  project: project
  region: region
  managedBy: 'bicep'
}
