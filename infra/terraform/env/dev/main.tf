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
}

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
