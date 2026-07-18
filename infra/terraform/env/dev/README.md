# Omnipost Dev Terraform

This stack owns the live Omnipost production-like dev runtime.

DNS records for `omnipost.neuralliquid.ai` are owned by
`neuralliquid-org/infra/terraform/dns`.

## Backend

- resource group: `nl-org-tfstate-rg`
- storage account: `nlorgtfstate`
- container: `tfstate`
- key: `products/omnipost/dev.tfstate`

## Managed Resources

- `nl-dev-omnipost-rg`
- `nl-dev-omnipost-asp`
- `nl-dev-omnipost-web`
- `nl-dev-omnipost-law`
- `nl-dev-omnipost-ai`
- Omnipost metric alerts
- `omnipost.neuralliquid.ai` hostname binding

The existing App Service managed certificate remains live in Azure but is not
managed by this first Terraform pass because importing it as
`azurerm_app_service_managed_certificate` forced replacement in the provider
plan. Normalize certificate lifecycle in a later, explicit pass.

## Commands

```bash
terraform -chdir=infra/terraform/env/dev init
terraform -chdir=infra/terraform/env/dev validate
terraform -chdir=infra/terraform/env/dev plan
```
