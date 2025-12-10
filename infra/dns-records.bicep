// DNS Records Module
// Creates DNS records in the existing DNS zone
// This module must be deployed with scope: resourceGroup(dnsZoneResourceGroup)

@description('DNS Zone name')
param dnsZoneName string

@description('Application subdomain')
param appSubdomain string

@description('API subdomain')
param apiSubdomain string

@description('Web App default hostname')
param webAppDefaultHostname string

@description('Tags to apply to resources')
param tags object = {}

// Reference existing DNS zone (in the same resource group as this module's scope)
resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' existing = {
  name: dnsZoneName
}

// CNAME record for main app subdomain (omnipost.nexamesh.ai)
resource appCnameRecord 'Microsoft.Network/dnsZones/CNAME@2018-05-01' = {
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
resource apiCnameRecord 'Microsoft.Network/dnsZones/CNAME@2018-05-01' = {
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
resource appVerifyTxtRecord 'Microsoft.Network/dnsZones/TXT@2018-05-01' = {
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
resource apiVerifyTxtRecord 'Microsoft.Network/dnsZones/TXT@2018-05-01' = {
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
output appCnameRecordFqdn string = '${appSubdomain}.${dnsZoneName}'
output apiCnameRecordFqdn string = '${apiSubdomain}.${dnsZoneName}'
output appVerifyRecordFqdn string = 'awverify.${appSubdomain}.${dnsZoneName}'
output apiVerifyRecordFqdn string = 'awverify.${apiSubdomain}.${dnsZoneName}'
