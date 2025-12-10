// DNS Configuration Module for nexamesh.ai
// Configures DNS records for OmniPost application

@description('DNS Zone name')
param dnsZoneName string = 'nexamesh.ai'

@description('DNS Zone resource group name')
param dnsZoneResourceGroup string = 'rg-dns-global'

@description('Application subdomain')
param appSubdomain string = 'omnipost'

@description('API subdomain')
param apiSubdomain string = 'api.omnipost'

@description('Web App default hostname')
param webAppDefaultHostname string

@description('Web App resource ID for custom hostname binding')
param webAppId string

@description('Tags to apply to resources')
param tags object = {}

@description('Enable custom domain')
param enableCustomDomain bool = true

@description('Enable managed certificate')
param enableManagedCertificate bool = true

// Reference existing DNS zone
resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' existing = {
  name: dnsZoneName
  scope: resourceGroup(dnsZoneResourceGroup)
}

// CNAME record for main app subdomain (omnipost.nexamesh.ai)
resource appCnameRecord 'Microsoft.Network/dnsZones/CNAME@2018-05-01' = if (enableCustomDomain) {
  parent: dnsZone
  name: appSubdomain
  properties: {
    TTL: 3600
    CNAMERecord: {
      cname: webAppDefaultHostname
    }
    metadata: tags
  }
}

// CNAME record for API subdomain (api.omnipost.nexamesh.ai)
resource apiCnameRecord 'Microsoft.Network/dnsZones/CNAME@2018-05-01' = if (enableCustomDomain) {
  parent: dnsZone
  name: apiSubdomain
  properties: {
    TTL: 3600
    CNAMERecord: {
      cname: webAppDefaultHostname
    }
    metadata: tags
  }
}

// TXT record for domain verification (awverify.omnipost)
resource appVerifyTxtRecord 'Microsoft.Network/dnsZones/TXT@2018-05-01' = if (enableCustomDomain) {
  parent: dnsZone
  name: 'awverify.${appSubdomain}'
  properties: {
    TTL: 3600
    TXTRecords: [
      {
        value: [webAppDefaultHostname]
      }
    ]
    metadata: tags
  }
}

// TXT record for API domain verification (awverify.api.omnipost)
resource apiVerifyTxtRecord 'Microsoft.Network/dnsZones/TXT@2018-05-01' = if (enableCustomDomain) {
  parent: dnsZone
  name: 'awverify.${apiSubdomain}'
  properties: {
    TTL: 3600
    TXTRecords: [
      {
        value: [webAppDefaultHostname]
      }
    ]
    metadata: tags
  }
}

// Output DNS records information
output appCnameRecordFqdn string = enableCustomDomain ? '${appSubdomain}.${dnsZoneName}' : ''
output apiCnameRecordFqdn string = enableCustomDomain ? '${apiSubdomain}.${dnsZoneName}' : ''
output appVerifyRecordFqdn string = enableCustomDomain ? 'awverify.${appSubdomain}.${dnsZoneName}' : ''
output apiVerifyRecordFqdn string = enableCustomDomain ? 'awverify.${apiSubdomain}.${dnsZoneName}' : ''
