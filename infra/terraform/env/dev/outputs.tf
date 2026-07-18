output "web_app_name" {
  value = azurerm_linux_web_app.web.name
}

output "web_app_default_hostname" {
  value = azurerm_linux_web_app.web.default_hostname
}

output "custom_hostname" {
  value = var.custom_hostname
}

output "application_insights_connection_string" {
  value     = azurerm_application_insights.this.connection_string
  sensitive = true
}
