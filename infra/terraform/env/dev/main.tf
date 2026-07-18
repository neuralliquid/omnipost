locals {
  org         = "nl"
  environment = "dev"
  project     = "omnipost"
  region      = "euw"
  base        = "${local.org}-${local.environment}-${local.project}"

  tags = {
    org         = local.org
    environment = local.environment
    project     = local.project
    region      = local.region
    managedBy   = "bicep"
  }

  sluice_litellm_config = yamlencode({
    model_list = [
      {
        model_name = var.sluice_default_model
        litellm_params = {
          model       = "azure/${var.sluice_default_model}"
          api_base    = var.sluice_azure_openai_endpoint
          api_key     = "os.environ/LITELLM_AZURE_OPENAI_API_KEY"
          api_version = var.sluice_azure_openai_api_version
        }
      },
      {
        model_name = var.sluice_embedding_model
        litellm_params = {
          model       = "azure/${var.sluice_embedding_model}"
          api_base    = var.sluice_azure_openai_endpoint
          api_key     = "os.environ/LITELLM_AZURE_OPENAI_API_KEY"
          api_version = var.sluice_azure_openai_embedding_api_version
        }
      }
    ]
    general_settings = {
      master_key = "os.environ/LITELLM_GATEWAY_KEY"
    }
  })
}

data "azurerm_client_config" "current" {}

resource "azurerm_resource_group" "this" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_service_plan" "this" {
  name                = "${local.base}-asp"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  os_type             = "Linux"
  sku_name            = "B1"
  tags                = local.tags
}

resource "azurerm_linux_web_app" "web" {
  name                    = "${local.base}-web"
  resource_group_name     = azurerm_resource_group.this.name
  location                = azurerm_resource_group.this.location
  service_plan_id         = azurerm_service_plan.this.id
  https_only              = false
  client_affinity_enabled = true
  tags                    = local.tags

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = true
    application_stack { node_version = "20-lts" }
    app_command_line    = "node server.js"
    http2_enabled       = true
    minimum_tls_version = "1.2"
    ftps_state          = "FtpsOnly"
    use_32_bit_worker   = true
  }

  app_settings = {
    SCM_DO_BUILD_DURING_DEPLOYMENT      = "false"
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "false"
    WEBSITE_NODE_DEFAULT_VERSION        = "~20"
    NODE_ENV                            = "production"
    NEXT_PUBLIC_SITE_URL                = "https://${local.base}-web.azurewebsites.net"
    PORT                                = "8080"
    WEBSITES_PORT                       = "8080"
    WEBSITE_RUN_FROM_PACKAGE            = "1"
    ENABLE_ORYX_BUILD                   = "false"
    WEBSITE_STARTUP_FILE                = "startup.sh"
    ENVIRONMENT                         = local.environment
    ORG                                 = local.org
    PROJECT                             = local.project
  }

  lifecycle {
    ignore_changes = [
      app_settings,
      logs,
      site_config,
    ]
  }
}

resource "azurerm_log_analytics_workspace" "this" {
  name                         = "${local.base}-law"
  resource_group_name          = azurerm_resource_group.this.name
  location                     = azurerm_resource_group.this.location
  sku                          = "PerGB2018"
  retention_in_days            = 30
  local_authentication_enabled = false
  tags                         = local.tags
}

resource "azurerm_application_insights" "this" {
  name                = "${local.base}-ai"
  resource_group_name = azurerm_resource_group.this.name
  location            = azurerm_resource_group.this.location
  application_type    = "web"
  sampling_percentage = 0
  workspace_id        = azurerm_log_analytics_workspace.this.id
  tags                = local.tags
}

resource "azurerm_monitor_metric_alert" "high_5xx_errors" {
  name                = "${local.base}-ai-high-5xx-errors"
  resource_group_name = azurerm_resource_group.this.name
  scopes              = [azurerm_linux_web_app.web.id]
  description         = "Alert when HTTP 5xx errors exceed threshold"
  severity            = 2
  auto_mitigate       = false
  frequency           = "PT5M"
  window_size         = "PT5M"
  tags                = local.tags

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http5xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 10
  }

  lifecycle {
    ignore_changes = [criteria]
  }
}

resource "azurerm_monitor_metric_alert" "high_response_time" {
  name                = "${local.base}-ai-high-response-time"
  resource_group_name = azurerm_resource_group.this.name
  scopes              = [azurerm_linux_web_app.web.id]
  description         = "Alert when average response time exceeds 2 seconds"
  severity            = 3
  auto_mitigate       = false
  frequency           = "PT5M"
  window_size         = "PT15M"
  tags                = local.tags

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "AverageResponseTime"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 2
  }

  lifecycle {
    ignore_changes = [criteria]
  }
}

resource "azurerm_monitor_metric_alert" "high_memory" {
  name                = "${local.base}-ai-high-memory"
  resource_group_name = azurerm_resource_group.this.name
  scopes              = [azurerm_linux_web_app.web.id]
  description         = "Alert when memory working set exceeds 1GB"
  severity            = 3
  auto_mitigate       = false
  frequency           = "PT5M"
  window_size         = "PT15M"
  tags                = local.tags

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "MemoryWorkingSet"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 1073741824
  }

  lifecycle {
    ignore_changes = [criteria]
  }
}

resource "azurerm_app_service_custom_hostname_binding" "web" {
  hostname            = var.custom_hostname
  app_service_name    = azurerm_linux_web_app.web.name
  resource_group_name = azurerm_resource_group.this.name
}

resource "azurerm_key_vault" "this" {
  count = var.enable_key_vault ? 1 : 0

  name                            = "${local.base}-kv"
  resource_group_name             = azurerm_resource_group.this.name
  location                        = azurerm_resource_group.this.location
  tenant_id                       = data.azurerm_client_config.current.tenant_id
  sku_name                        = "standard"
  enabled_for_deployment          = false
  enabled_for_disk_encryption     = false
  enabled_for_template_deployment = true
  rbac_authorization_enabled      = true
  purge_protection_enabled        = false
  soft_delete_retention_days      = 90
  public_network_access_enabled   = true
  tags                            = merge(local.tags, { managedBy = "terraform", component = "secrets" })

  network_acls {
    default_action = "Allow"
    bypass         = "AzureServices"
  }
}

resource "azurerm_role_assignment" "web_key_vault_secrets_user" {
  count = var.enable_key_vault ? 1 : 0

  scope                = azurerm_key_vault.this[0].id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_linux_web_app.web.identity[0].principal_id
}

resource "azurerm_container_app_environment" "sluice" {
  count = var.enable_sluice_gateway ? 1 : 0

  name                       = "${local.base}-cae"
  resource_group_name        = azurerm_resource_group.this.name
  location                   = azurerm_resource_group.this.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.this.id
  tags                       = merge(local.tags, { managedBy = "terraform", component = "sluice-gateway" })
}

resource "azurerm_container_app" "sluice" {
  count = var.enable_sluice_gateway ? 1 : 0

  name                         = "${local.base}-sluice"
  resource_group_name          = azurerm_resource_group.this.name
  container_app_environment_id = azurerm_container_app_environment.sluice[0].id
  revision_mode                = "Single"
  tags                         = merge(local.tags, { managedBy = "terraform", component = "sluice-gateway" })

  secret {
    name  = "azure-openai-endpoint"
    value = var.sluice_azure_openai_endpoint
  }

  secret {
    name  = "azure-openai-api-key"
    value = var.sluice_azure_openai_api_key
  }

  secret {
    name  = "sluice-api-key"
    value = var.sluice_api_key
  }

  ingress {
    external_enabled = true
    target_port      = 4000
    transport        = "http"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 0
    max_replicas = 3

    http_scale_rule {
      name                = "http-requests"
      concurrent_requests = "50"
    }

    container {
      name   = "litellm"
      image  = var.sluice_image
      cpu    = 0.5
      memory = "1Gi"

      command = [
        "/bin/sh",
        "-c",
        "printf '%s' \"$LITELLM_CONFIG_CONTENT\" > /tmp/proxy_config.yaml && exec litellm --config /tmp/proxy_config.yaml --port 4000"
      ]

      env {
        name  = "LITELLM_CONFIG_CONTENT"
        value = local.sluice_litellm_config
      }

      env {
        name        = "LITELLM_AZURE_OPENAI_API_KEY"
        secret_name = "azure-openai-api-key"
      }

      env {
        name        = "LITELLM_GATEWAY_KEY"
        secret_name = "sluice-api-key"
      }

      env {
        name  = "PORT"
        value = "4000"
      }

      liveness_probe {
        transport        = "HTTP"
        path             = "/health/liveliness"
        port             = 4000
        initial_delay    = 5
        interval_seconds = 10
      }

      readiness_probe {
        transport        = "HTTP"
        path             = "/health/liveliness"
        port             = 4000
        initial_delay    = 3
        interval_seconds = 5
      }
    }
  }
}

resource "azurerm_postgresql_flexible_server" "this" {
  count = var.enable_postgresql ? 1 : 0

  name                          = "${local.base}-psql"
  resource_group_name           = azurerm_resource_group.this.name
  location                      = azurerm_resource_group.this.location
  version                       = var.postgresql_version
  administrator_login           = var.postgresql_administrator_login
  administrator_password        = var.postgresql_administrator_password
  sku_name                      = "B_Standard_B1ms"
  storage_mb                    = var.postgresql_storage_mb
  backup_retention_days         = var.postgresql_backup_retention_days
  public_network_access_enabled = true
  tags                          = merge(local.tags, { managedBy = "terraform", component = "postgresql" })
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "allow_azure_services" {
  count = var.enable_postgresql ? 1 : 0

  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.this[0].id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

resource "azurerm_postgresql_flexible_server_database" "app" {
  count = var.enable_postgresql ? 1 : 0

  name      = var.postgresql_database_name
  server_id = azurerm_postgresql_flexible_server.this[0].id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
