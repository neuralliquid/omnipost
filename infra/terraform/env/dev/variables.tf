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
