import {
  to = azurerm_resource_group.this
  id = "/subscriptions/bb4e3882-2079-4bab-8974-611bc0b8bb58/resourceGroups/nl-dev-omnipost-rg"
}

import {
  to = azurerm_service_plan.this
  id = "/subscriptions/bb4e3882-2079-4bab-8974-611bc0b8bb58/resourceGroups/nl-dev-omnipost-rg/providers/Microsoft.Web/serverFarms/nl-dev-omnipost-asp"
}

import {
  to = azurerm_linux_web_app.web
  id = "/subscriptions/bb4e3882-2079-4bab-8974-611bc0b8bb58/resourceGroups/nl-dev-omnipost-rg/providers/Microsoft.Web/sites/nl-dev-omnipost-web"
}

import {
  to = azurerm_log_analytics_workspace.this
  id = "/subscriptions/bb4e3882-2079-4bab-8974-611bc0b8bb58/resourceGroups/nl-dev-omnipost-rg/providers/Microsoft.OperationalInsights/workspaces/nl-dev-omnipost-law"
}

import {
  to = azurerm_application_insights.this
  id = "/subscriptions/bb4e3882-2079-4bab-8974-611bc0b8bb58/resourceGroups/nl-dev-omnipost-rg/providers/Microsoft.Insights/components/nl-dev-omnipost-ai"
}

import {
  to = azurerm_monitor_metric_alert.high_5xx_errors
  id = "/subscriptions/bb4e3882-2079-4bab-8974-611bc0b8bb58/resourceGroups/nl-dev-omnipost-rg/providers/Microsoft.Insights/metricAlerts/nl-dev-omnipost-ai-high-5xx-errors"
}

import {
  to = azurerm_monitor_metric_alert.high_response_time
  id = "/subscriptions/bb4e3882-2079-4bab-8974-611bc0b8bb58/resourceGroups/nl-dev-omnipost-rg/providers/Microsoft.Insights/metricAlerts/nl-dev-omnipost-ai-high-response-time"
}

import {
  to = azurerm_monitor_metric_alert.high_memory
  id = "/subscriptions/bb4e3882-2079-4bab-8974-611bc0b8bb58/resourceGroups/nl-dev-omnipost-rg/providers/Microsoft.Insights/metricAlerts/nl-dev-omnipost-ai-high-memory"
}

import {
  to = azurerm_app_service_custom_hostname_binding.web
  id = "/subscriptions/bb4e3882-2079-4bab-8974-611bc0b8bb58/resourceGroups/nl-dev-omnipost-rg/providers/Microsoft.Web/sites/nl-dev-omnipost-web/hostNameBindings/omnipost.neuralliquid.ai"
}
