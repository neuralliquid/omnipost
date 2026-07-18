# OmniPost Deployment

OmniPost currently runs as a production-like dev deployment on Azure App
Service.

## Live URLs

- Public URL: `https://omnipost.neuralliquid.ai`
- Azure default URL: `https://nl-dev-omnipost-web.azurewebsites.net`
- Health: `https://omnipost.neuralliquid.ai/api/health`

## Infrastructure Ownership

Product runtime is owned by this repo:

- Terraform stack: `infra/terraform/env/dev`
- State key: `products/omnipost/dev.tfstate`
- Resource group: `nl-dev-omnipost-rg`
- Web App: `nl-dev-omnipost-web`
- App Service Plan: `nl-dev-omnipost-asp`
- Observability: Log Analytics, Application Insights, metric alerts
- Hostname binding: `omnipost.neuralliquid.ai`

Organization DNS is owned by `neuralliquid-org`:

- `omnipost.neuralliquid.ai` CNAME
- `asuid.omnipost` TXT validation record

Do not create or update `neuralliquid.ai` DNS records from this repo.

## Terraform Commands

```bash
terraform -chdir=infra/terraform/env/dev init
terraform -chdir=infra/terraform/env/dev validate
terraform -chdir=infra/terraform/env/dev plan
```

The current imported state has a clean plan: no changes.

## Application Deployment

Application package deployment still uses GitHub Actions and Azure Web Apps
deployment. The infrastructure ownership path is Terraform-first; the remaining
Bicep files are legacy/runtime helpers while quick iteration continues.

## Verification

```bash
curl -I https://omnipost.neuralliquid.ai/api/health
curl -I https://nl-dev-omnipost-web.azurewebsites.net/api/health
```

Expected result: HTTP `200 OK`.
