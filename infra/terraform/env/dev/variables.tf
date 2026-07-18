variable "subscription_id" {
  type        = string
  description = "Azure subscription containing the Omnipost dev runtime."
  default     = "bb4e3882-2079-4bab-8974-611bc0b8bb58"
}

variable "location" {
  type        = string
  description = "Azure region for Omnipost dev resources."
  default     = "westeurope"
}

variable "resource_group_name" {
  type        = string
  description = "Resource group containing Omnipost dev resources."
  default     = "nl-dev-omnipost-rg"
}

variable "custom_hostname" {
  type        = string
  description = "Public Omnipost hostname. DNS is owned by neuralliquid-org."
  default     = "omnipost.neuralliquid.ai"
}

variable "enable_key_vault" {
  type        = bool
  description = "Whether to manage the Omnipost Key Vault."
  default     = true
}

variable "enable_sluice_gateway" {
  type        = bool
  description = "Whether to manage the internal Sluice gateway Container App."
  default     = true
}

variable "sluice_image" {
  type        = string
  description = "Container image for the Sluice gateway."
  default     = "litellm/litellm:v1.83.7-stable"
}

variable "sluice_azure_openai_endpoint" {
  type        = string
  description = "Azure OpenAI endpoint used by the Sluice gateway."
  sensitive   = true
}

variable "sluice_azure_openai_api_key" {
  type        = string
  description = "Azure OpenAI API key used by the Sluice gateway."
  sensitive   = true
}

variable "sluice_api_key" {
  type        = string
  description = "API key required by clients calling the Sluice gateway."
  sensitive   = true
}

variable "sluice_default_model" {
  type        = string
  description = "Default Azure OpenAI deployment/model exposed through Sluice."
  default     = "gpt-4o"
}

variable "sluice_embedding_model" {
  type        = string
  description = "Azure OpenAI embedding deployment/model exposed through Sluice."
  default     = "text-embedding-3-large"
}

variable "sluice_azure_openai_api_version" {
  type        = string
  description = "Azure OpenAI API version for default Sluice model calls."
  default     = "2025-04-01-preview"
}

variable "sluice_azure_openai_embedding_api_version" {
  type        = string
  description = "Azure OpenAI API version for Sluice embedding calls."
  default     = "2024-02-01"
}

variable "enable_postgresql" {
  type        = bool
  description = "Whether to manage Omnipost PostgreSQL. Kept false during quick iteration."
  default     = false
}

variable "postgresql_administrator_login" {
  type        = string
  description = "PostgreSQL administrator login, required only when enable_postgresql is true."
  default     = "omnipostadmin"
}

variable "postgresql_administrator_password" {
  type        = string
  description = "PostgreSQL administrator password, required only when enable_postgresql is true."
  sensitive   = true
  default     = null
}

variable "postgresql_version" {
  type        = string
  description = "PostgreSQL major version."
  default     = "16"
}

variable "postgresql_database_name" {
  type        = string
  description = "Omnipost PostgreSQL application database name."
  default     = "omnipost"
}

variable "postgresql_storage_mb" {
  type        = number
  description = "PostgreSQL storage size in MB."
  default     = 32768
}

variable "postgresql_backup_retention_days" {
  type        = number
  description = "PostgreSQL backup retention in days."
  default     = 7
}
