<#
.SYNOPSIS
    Deploys Azure infrastructure for the Content Creation Platform.

.DESCRIPTION
    This PowerShell script handles Azure login and deploys the required infrastructure
    using Bicep templates. It can create resource groups if they don't exist,
    preview changes (what-if), and deploy the infrastructure.

.PARAMETER Environment
    The target environment (dev, test, prod). Default is 'dev'.

.PARAMETER Location
    The Azure region for deployment. Default is 'westeurope'.

.PARAMETER LocationCode
    Short code for the location (e.g., 'euw' for West Europe). Default is 'euw'.

.PARAMETER ProjectName
    The name of the project. Default is 'content-creation'.

.PARAMETER Sku
    The SKU for the App Service Plan. Default is 'B1'.

.PARAMETER Preview
    If specified, performs a what-if deployment to preview changes without applying them.

.PARAMETER SkipLogin
    If specified, skips the Azure login step (useful when already authenticated).

.EXAMPLE
    .\deploy-infrastructure.ps1

.EXAMPLE
    .\deploy-infrastructure.ps1 -Environment prod -Location eastus -LocationCode eus

.EXAMPLE
    .\deploy-infrastructure.ps1 -Preview

.EXAMPLE
    .\deploy-infrastructure.ps1 -Environment test -SkipLogin
#>

[CmdletBinding()]
param(
    [Parameter()]
    [ValidateSet('dev', 'test', 'prod')]
    [string]$Environment = 'dev',

    [Parameter()]
    [string]$Location = 'westeurope',

    [Parameter()]
    [string]$LocationCode = 'euw',

    [Parameter()]
    [string]$ProjectName = 'content-creation',

    [Parameter()]
    [ValidateSet('B1', 'B2', 'B3', 'S1', 'S2', 'S3', 'P1v2', 'P2v2', 'P3v2')]
    [string]$Sku = 'B1',

    [Parameter()]
    [switch]$Preview,

    [Parameter()]
    [switch]$SkipLogin
)

# Set strict mode for better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Script configuration
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$InfraPath = Join-Path -Path (Split-Path -Parent $ScriptRoot) -ChildPath 'infra'
$BicepFile = Join-Path -Path $InfraPath -ChildPath 'main.bicep'

# Generate resource names following the naming convention
$ResourceGroupName = "$Environment-$LocationCode-rg-$ProjectName"
$AppName = "$Environment-$LocationCode-app-$ProjectName"

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "[*] $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor Green
}

function Write-Failure {
    param([string]$Message)
    Write-Host "[✗] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "    $Message" -ForegroundColor Gray
}

function Test-AzureCLI {
    <#
    .SYNOPSIS
        Checks if Azure CLI is installed and accessible.
    #>
    try {
        az version 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function Test-AzureLogin {
    <#
    .SYNOPSIS
        Checks if the user is logged into Azure.
    #>
    try {
        az account show 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
}

function Connect-AzureAccount {
    <#
    .SYNOPSIS
        Handles Azure login process.
    #>
    Write-Step "Checking Azure authentication..."

    if (Test-AzureLogin) {
        $accountInfo = az account show --output json | ConvertFrom-Json
        Write-Success "Already logged in as: $($accountInfo.user.name)"
        Write-Info "Subscription: $($accountInfo.name) ($($accountInfo.id))"
        return $true
    }

    Write-Step "Not logged in. Initiating Azure login..."
    try {
        az login
        if ($LASTEXITCODE -ne 0) {
            Write-Failure "Azure login failed."
            return $false
        }
        Write-Success "Azure login successful."
        return $true
    }
    catch {
        Write-Failure "Azure login failed: $_"
        return $false
    }
}

function Test-ResourceGroupExists {
    <#
    .SYNOPSIS
        Checks if a resource group exists.
    #>
    param([string]$Name)

    try {
        $result = az group exists --name $Name 2>&1
        return $result -eq 'true'
    }
    catch {
        return $false
    }
}

function New-ResourceGroupIfNotExists {
    <#
    .SYNOPSIS
        Creates a resource group if it doesn't exist.
    #>
    param(
        [string]$Name,
        [string]$Location,
        [hashtable]$Tags
    )

    Write-Step "Checking if resource group '$Name' exists..."

    if (Test-ResourceGroupExists -Name $Name) {
        Write-Success "Resource group '$Name' already exists."
        return $true
    }

    Write-Step "Creating resource group '$Name' in '$Location'..."
    try {
        az group create `
            --name $Name `
            --location $Location `
            --tags "environment=$($Tags.environment)" "project=$($Tags.project)" `
            --output none

        if ($LASTEXITCODE -ne 0) {
            Write-Failure "Failed to create resource group."
            return $false
        }

        Write-Success "Resource group '$Name' created successfully."
        return $true
    }
    catch {
        Write-Failure "Failed to create resource group: $_"
        return $false
    }
}

function Deploy-BicepTemplate {
    <#
    .SYNOPSIS
        Deploys the Bicep template to Azure.
    #>
    param(
        [string]$ResourceGroupName,
        [string]$TemplateFile,
        [string]$AppName,
        [string]$Location,
        [string]$Sku,
        [bool]$WhatIf
    )

    # Validate Bicep file exists
    if (-not (Test-Path $TemplateFile)) {
        Write-Failure "Bicep template not found at: $TemplateFile"
        return $false
    }

    $deploymentName = "deployment-$(Get-Date -Format 'yyyyMMddHHmmss')"

    if ($WhatIf) {
        Write-Header "Preview Deployment (What-If)"
        Write-Step "Running what-if analysis..."

        try {
            az deployment group what-if `
                --resource-group $ResourceGroupName `
                --template-file $TemplateFile `
                --parameters appName=$AppName location=$Location sku=$Sku `
                --name $deploymentName

            if ($LASTEXITCODE -ne 0) {
                Write-Failure "What-if analysis failed."
                return $false
            }

            Write-Success "What-if analysis completed. Review the changes above."
            Write-Info "Run without -Preview flag to apply these changes."
            return $true
        }
        catch {
            Write-Failure "What-if analysis failed: $_"
            return $false
        }
    }
    else {
        Write-Header "Deploying Infrastructure"
        Write-Step "Deploying Bicep template..."

        try {
            $result = az deployment group create `
                --resource-group $ResourceGroupName `
                --template-file $TemplateFile `
                --parameters appName=$AppName location=$Location sku=$Sku `
                --name $deploymentName `
                --output json | ConvertFrom-Json

            if ($LASTEXITCODE -ne 0) {
                Write-Failure "Deployment failed."
                return $false
            }

            Write-Success "Deployment completed successfully."

            # Display outputs
            if ($result.properties.outputs) {
                Write-Host ""
                Write-Host "Deployment Outputs:" -ForegroundColor Cyan
                if ($result.properties.outputs.webAppName) {
                    Write-Info "Web App Name: $($result.properties.outputs.webAppName.value)"
                }
                if ($result.properties.outputs.webAppUrl) {
                    Write-Info "Web App URL: $($result.properties.outputs.webAppUrl.value)"
                }
            }

            return $true
        }
        catch {
            Write-Failure "Deployment failed: $_"
            return $false
        }
    }
}

function Show-DeploymentSummary {
    <#
    .SYNOPSIS
        Displays a summary of the deployment configuration.
    #>
    Write-Header "Deployment Configuration"
    Write-Host "Environment:          $Environment" -ForegroundColor White
    Write-Host "Location:             $Location ($LocationCode)" -ForegroundColor White
    Write-Host "Project Name:         $ProjectName" -ForegroundColor White
    Write-Host "SKU:                  $Sku" -ForegroundColor White
    Write-Host ""
    Write-Host "Resource Names:" -ForegroundColor Cyan
    Write-Host "  Resource Group:     $ResourceGroupName" -ForegroundColor White
    Write-Host "  App Name:           $AppName" -ForegroundColor White
    Write-Host "  App Service Plan:   $AppServicePlanName" -ForegroundColor White
    Write-Host ""
    Write-Host "Bicep Template:       $BicepFile" -ForegroundColor White
    Write-Host "Mode:                 $(if ($Preview) { 'Preview (What-If)' } else { 'Deploy' })" -ForegroundColor White
}

# Main execution
function Main {
    Write-Header "Content Creation Platform - Infrastructure Deployment"

    # Check Azure CLI
    Write-Step "Checking Azure CLI installation..."
    if (-not (Test-AzureCLI)) {
        Write-Failure "Azure CLI is not installed or not in PATH."
        Write-Info "Please install Azure CLI from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    }
    Write-Success "Azure CLI is installed."

    # Show deployment summary
    Show-DeploymentSummary

    # Handle Azure login
    if (-not $SkipLogin) {
        if (-not (Connect-AzureAccount)) {
            Write-Failure "Azure authentication failed. Exiting."
            exit 1
        }
    }
    else {
        Write-Step "Skipping login check (SkipLogin flag set)."
        if (-not (Test-AzureLogin)) {
            Write-Failure "Not logged into Azure. Please run 'az login' first or remove -SkipLogin flag."
            exit 1
        }
    }

    # Create resource group if needed
    $tags = @{
        environment = $Environment
        project     = $ProjectName
    }

    if (-not (New-ResourceGroupIfNotExists -Name $ResourceGroupName -Location $Location -Tags $tags)) {
        Write-Failure "Failed to create or verify resource group. Exiting."
        exit 1
    }

    # Deploy Bicep template
    $deploySuccess = Deploy-BicepTemplate `
        -ResourceGroupName $ResourceGroupName `
        -TemplateFile $BicepFile `
        -AppName $AppName `
        -Location $Location `
        -Sku $Sku `
        -WhatIf $Preview

    if (-not $deploySuccess) {
        Write-Failure "Deployment failed. Exiting."
        exit 1
    }

    Write-Header "Deployment Complete"
    if (-not $Preview) {
        Write-Success "Infrastructure has been deployed successfully!"
        Write-Info "You can now deploy your application using GitHub Actions"
        Write-Info "or by running: az webapp deployment source config-zip ..."
    }
}

# Run main function
Main
