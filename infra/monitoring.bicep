// Application Insights Module for Monitoring
// Provides application performance monitoring, logging, and alerting

@description('Organisation code')
param org string

@description('Environment')
param env string

@description('Project name')
param project string

@description('Region code')
param region string

@description('The location to deploy Application Insights')
param location string = resourceGroup().location

@description('Tags to apply to resources')
param tags object = {}

@description('Web App resource ID for diagnostic settings')
param webAppId string

// Generate names
var base = '${org}-${env}-${project}'
var appInsightsName = '${base}-ai-${region}'
var logAnalyticsName = '${base}-law-${region}'

// Log Analytics Workspace (required for Application Insights)
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Alert: High HTTP 5xx errors
resource alert5xx 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${appInsightsName}-high-5xx-errors'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when HTTP 5xx errors exceed threshold'
    severity: 2
    enabled: true
    scopes: [
      webAppId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          criterionType: 'StaticThresholdCriterion'
          name: 'High5xxErrors'
          metricName: 'Http5xx'
          operator: 'GreaterThan'
          threshold: 10
          timeAggregation: 'Total'
        }
      ]
    }
  }
}

// Alert: High response time
resource alertResponseTime 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${appInsightsName}-high-response-time'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when average response time exceeds 2 seconds'
    severity: 3
    enabled: true
    scopes: [
      webAppId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          criterionType: 'StaticThresholdCriterion'
          name: 'HighResponseTime'
          metricName: 'AverageResponseTime'
          operator: 'GreaterThan'
          threshold: 2
          timeAggregation: 'Average'
        }
      ]
    }
  }
}

// Alert: High memory usage
resource alertMemory 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: '${appInsightsName}-high-memory'
  location: 'global'
  tags: tags
  properties: {
    description: 'Alert when memory working set exceeds 1GB'
    severity: 3
    enabled: true
    scopes: [
      webAppId
    ]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          criterionType: 'StaticThresholdCriterion'
          name: 'HighMemoryUsage'
          metricName: 'MemoryWorkingSet'
          operator: 'GreaterThan'
          threshold: 1073741824
          timeAggregation: 'Average'
        }
      ]
    }
  }
}

output appInsightsName string = appInsights.name
output appInsightsId string = appInsights.id
output instrumentationKey string = appInsights.properties.InstrumentationKey
output connectionString string = appInsights.properties.ConnectionString
output logAnalyticsWorkspaceId string = logAnalytics.id
