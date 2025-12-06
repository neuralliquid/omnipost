#!/bin/bash

# Input parameters
org=$1            # nl, pvc, tws, mys
environment=$2    # dev, staging, prod
project=$3        # content-creation, autopr, rooivalk, etc.
region=$4         # euw, san, saf, swe, etc.

# Validate org code
case "$org" in
  nl|pvc|tws|mys)
    ;;
  *)
    echo "Error: Invalid org code '$org'. Must be: nl, pvc, tws, or mys" >&2
    exit 1
    ;;
esac

# Validate environment
case "$environment" in
  dev|staging|prod)
    ;;
  *)
    echo "Error: Invalid environment '$environment'. Must be: dev, staging, or prod" >&2
    exit 1
    ;;
esac

# Validate region
case "$region" in
  euw|eun|wus|eus|san|saf|swe|uks|usw|glob)
    ;;
  *)
    echo "Error: Invalid region code '$region'" >&2
    exit 1
    ;;
esac

# Function to generate resource names following [org]-[env]-[project]-[type]-[region]
generate_names() {
  local o=$1
  local e=$2
  local p=$3
  local r=$4
  
  local base="${o}-${e}-${p}"
  
  # Resource Group: [org]-[env]-[project]-rg-[region]
  echo "RESOURCE_GROUP=${base}-rg-${r}"
  
  # App Service: [org]-[env]-[project]-app-[region]
  echo "APP_NAME=${base}-app-${r}"
  
  # App Service Plan: [org]-[env]-[project]-asp-[region]
  echo "ASP_NAME=${base}-asp-${r}"
  
  # Additional resource types (for future use)
  echo "API_NAME=${base}-api-${r}"
  echo "FUNC_NAME=${base}-func-${r}"
  echo "STORAGE_NAME=${base}-storage-${r}"
  echo "KV_NAME=${base}-kv-${r}"
  echo "DB_NAME=${base}-db-${r}"
}

# Generate and export names
generate_names "$org" "$environment" "$project" "$region"
