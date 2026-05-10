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
// Region suffix dropped per ADR-0027 (mystira) applied to omnipost. The `region` param is
// retained for tags + future multi-region disambiguation but is no longer in resource names.
var base = '${org}-${env}-${project}'

// Resource Group: [org]-[env]-[project]-rg
output rgName string = '${base}-rg'

// Compute Resources
output name_app string = '${base}-app'
output name_api string = '${base}-api'
output name_func string = '${base}-func'
output name_swa string = '${base}-swa'
output name_asp string = '${base}-asp'

// Data Resources
output name_db string = '${base}-db'
output name_storage string = '${base}-storage'
output name_cache string = '${base}-cache'
output name_queue string = '${base}-queue'

// Security Resources
output name_kv string = '${base}-kv'

// AI Resources
output name_ai string = '${base}-ai'

// Networking Resources
output name_vnet string = '${base}-vnet'
output name_subnet string = '${base}-subnet'
output name_dns string = '${base}-dns'

// Monitoring Resources
output name_law string = '${base}-law'
output name_log string = '${base}-law' // alias, kept for backward-compat with consumers using name_log

// Container Resources
output name_acr string = '${base}-acr'

// Metadata outputs
output base string = base
output fullPattern string = '[org]-[env]-[project]-[type]'
output tags object = {
  org: org
  environment: env
  project: project
  region: region
  managedBy: 'bicep'
}
