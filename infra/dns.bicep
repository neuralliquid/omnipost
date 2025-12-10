// DNS Configuration Module for nexamesh.ai
// Provides DNS zone information for OmniPost application
// Note: DNS records are created via dns-records.bicep module deployed to DNS zone resource group

@description('DNS Zone name')
param dnsZoneName string = 'nexamesh.ai'

@description('DNS Zone resource group name')
param dnsZoneResourceGroup string = 'rg-dns-global'

// Reference existing DNS zone in different resource group
resource dnsZone 'Microsoft.Network/dnsZones@2018-05-01' existing = {
  name: dnsZoneName
  scope: resourceGroup(dnsZoneResourceGroup)
}

// Output DNS zone information
output dnsZoneId string = dnsZone.id
output dnsZoneName string = dnsZone.name
output nameServers array = dnsZone.properties.nameServers
