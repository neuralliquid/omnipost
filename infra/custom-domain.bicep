// Custom Domain Binding Module
// Binds custom domains to Azure Web App with managed SSL certificates

@description('Web App name')
param webAppName string

@description('Custom domain hostname')
param customHostname string

@description('Enable managed SSL certificate')
param enableSsl bool = true

@description('SSL binding type')
@allowed(['SniEnabled', 'Disabled'])
param sslType string = 'SniEnabled'

@description('Tags')
param tags object = {}

// Reference existing Web App
resource webApp 'Microsoft.Web/sites@2022-09-01' existing = {
  name: webAppName
}

// Custom hostname binding
resource hostnameBinding 'Microsoft.Web/sites/hostNameBindings@2022-09-01' = {
  parent: webApp
  name: customHostname
  properties: {
    siteName: webAppName
    hostNameType: 'Verified'
    sslState: enableSsl ? sslType : 'Disabled'
    customHostNameDnsRecordType: 'CName'
  }
}

// Managed certificate (App Service Managed Certificate)
resource managedCertificate 'Microsoft.Web/certificates@2022-09-01' = if (enableSsl) {
  name: '${customHostname}-cert'
  location: resourceGroup().location
  tags: tags
  properties: {
    serverFarmId: webApp.properties.serverFarmId
    canonicalName: customHostname
  }
  dependsOn: [
    hostnameBinding
  ]
}

output hostnameBindingId string = hostnameBinding.id
output certificateThumbprint string = enableSsl ? managedCertificate.properties.thumbprint : ''
