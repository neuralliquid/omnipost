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

# Function to generate resource names following [org]-[env]-[project]-[type]
# Region suffix dropped per ADR-0027 (mystira) applied to omnipost. The `region` arg is
# retained for tag emission + backward-compat with callers; it no longer appears in names.
generate_names() {
  local o=$1
  local e=$2
  local p=$3
  # shellcheck disable=SC2034
  local r=$4  # retained for backward compat / tags; not in names

  local base="${o}-${e}-${p}"

  # Resource Group: [org]-[env]-[project]-rg
  echo "RESOURCE_GROUP=${base}-rg"

  # App Service: [org]-[env]-[project]-app
  echo "APP_NAME=${base}-app"

  # App Service Plan: [org]-[env]-[project]-asp
  echo "ASP_NAME=${base}-asp"

  # Additional resource types (for future use)
  echo "API_NAME=${base}-api"
  echo "FUNC_NAME=${base}-func"
  echo "STORAGE_NAME=${base}-storage"
  echo "KV_NAME=${base}-kv"
  echo "DB_NAME=${base}-db"
}

# Generate and export names
generate_names "$org" "$environment" "$project" "$region"
