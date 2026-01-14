# Priori Deployment Setup Script (PowerShell)
# Consolidated script for all deployment setup tasks
# Usage: .\scripts\deploy\setup.ps1 [COMMAND] [OPTIONS] [ENVIRONMENT]

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Environment = "staging",
    
    [string]$RailwayToken = $env:RAILWAY_TOKEN
)

# =============================================================================
# Constants
# =============================================================================

$RAILWAY_PROJECT_ID = "3ff6be5c-ffda-42e0-ab78-80d34b0c871b"
$STAGING_ENV_ID = "b0101648-5024-4c3e-bafb-8bd0ef1e124b"
$PROD_ENV_ID = "0115af74-72b3-48ed-a9a7-b39dbbde0fc2"
$STAGING_SERVICE_ID = "c6fb59a7-7d9b-4e0f-9061-770c9d9e7fa3"
$PROD_SERVICE_ID = "c1771311-72e3-4cd9-9284-9815f508d66b"

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent (Split-Path -Parent $SCRIPT_DIR)

# =============================================================================
# Helper Functions
# =============================================================================

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Header {
    param([string]$Message)
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# =============================================================================
# Prerequisites Check
# =============================================================================

function Test-Prerequisites {
    Write-Header "Checking Prerequisites"
    
    $missingDeps = @()
    
    if (-not (Test-CommandExists "docker")) {
        $missingDeps += "docker"
    }
    
    if (-not (Test-CommandExists "node")) {
        $missingDeps += "node"
    }
    
    if (-not (Test-CommandExists "npm")) {
        $missingDeps += "npm"
    }
    
    if ($missingDeps.Count -gt 0) {
        Write-Error "Missing dependencies: $($missingDeps -join ', ')"
        return $false
    }
    
    Write-Success "All prerequisites met"
    return $true
}

function Test-RailwayCLI {
    if (-not (Test-CommandExists "railway")) {
        Write-Error "Railway CLI not found. Install with: npm install -g @railway/cli"
        Write-Info "Or visit: https://docs.railway.app/develop/cli"
        return $false
    }
    
    Write-Success "Railway CLI found"
    return $true
}

# =============================================================================
# Railway Authentication
# =============================================================================

function Test-RailwayAuth {
    Write-Header "Checking Railway Authentication"
    
    if (-not (Test-RailwayCLI)) {
        return $false
    }
    
    # Test if already authenticated
    $result = railway whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Already authenticated to Railway"
        Write-Info "User: $result"
        return $true
    }
    
    Write-Warning "Not authenticated to Railway"
    return $false
}

function Connect-Railway {
    Write-Header "Authenticating with Railway"
    
    if (-not (Test-RailwayCLI)) {
        return $false
    }
    
    # Check if token is provided
    if ($RailwayToken) {
        Write-Info "Using provided Railway token"
        $env:RAILWAY_TOKEN = $RailwayToken
        
        # Test authentication
        $result = railway whoami 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Authentication successful"
            return $true
        } else {
            Write-Error "Token authentication failed"
            return $false
        }
    }
    
    # Interactive login
    Write-Info "Starting interactive login..."
    Write-Info "This will open your browser for authentication"
    
    railway login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Authentication successful"
        return $true
    } else {
        Write-Error "Authentication failed"
        return $false
    }
}

# =============================================================================
# Railway Link
# =============================================================================

function Connect-RailwayProject {
    Write-Header "Linking to Railway Project"
    
    if (-not (Test-RailwayAuth)) {
        Write-Error "Not authenticated. Run: .\scripts\deploy\setup.ps1 auth"
        return $false
    }
    
    Write-Info "Linking to project: $RAILWAY_PROJECT_ID"
    
    # Link using service ID directly (CI-safe method)
    if ($Environment -eq "staging") {
        Write-Info "Linking to staging environment"
        railway link $RAILWAY_PROJECT_ID --environment $STAGING_ENV_ID
    } else {
        Write-Info "Linking to production environment"
        railway link $RAILWAY_PROJECT_ID --environment $PROD_ENV_ID
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Successfully linked to Railway project"
        return $true
    } else {
        Write-Error "Failed to link to Railway project"
        return $false
    }
}

# =============================================================================
# Deployment
# =============================================================================

function Start-RailwayDeployment {
    param(
        [string]$Env = "staging"
    )
    
    Write-Header "Deploying to Railway ($Env)"
    
    if (-not (Test-RailwayAuth)) {
        Write-Error "Not authenticated. Run: .\scripts\deploy\setup.ps1 auth"
        return $false
    }
    
    # Set environment
    $envId = if ($Env -eq "production") { $PROD_ENV_ID } else { $STAGING_ENV_ID }
    $serviceId = if ($Env -eq "production") { $PROD_SERVICE_ID } else { $STAGING_SERVICE_ID }
    
    Write-Info "Environment: $Env"
    Write-Info "Environment ID: $envId"
    Write-Info "Service ID: $serviceId"
    
    # Deploy using up command with service configuration
    Write-Info "Starting deployment..."
    
    railway up --service $serviceId --environment $envId
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Deployment initiated successfully"
        Write-Info "Monitor deployment at: https://railway.app/project/$RAILWAY_PROJECT_ID"
        return $true
    } else {
        Write-Error "Deployment failed with exit code: $LASTEXITCODE"
        return $false
    }
}

# =============================================================================
# Environment Variables
# =============================================================================

function Set-RailwayVariables {
    param(
        [string]$Env = "staging"
    )
    
    Write-Header "Setting Railway Environment Variables"
    
    $envFile = if ($Env -eq "production") { ".env.production" } else { ".env.staging" }
    $envPath = Join-Path $PROJECT_ROOT $envFile
    
    if (-not (Test-Path $envPath)) {
        Write-Error "Environment file not found: $envPath"
        return $false
    }
    
    Write-Info "Reading variables from: $envFile"
    
    $envId = if ($Env -eq "production") { $PROD_ENV_ID } else { $STAGING_ENV_ID }
    
    # Read and set each variable
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            
            if ($key -and -not $key.StartsWith('#')) {
                Write-Info "Setting: $key"
                railway variables --set "$key=$value" --environment $envId
            }
        }
    }
    
    Write-Success "Environment variables set"
    return $true
}

# =============================================================================
# Main Commands
# =============================================================================

function Show-Help {
    Write-Header "Priori Deployment Setup"
    Write-Host ""
    Write-Host "Usage: .\scripts\deploy\setup.ps1 [COMMAND] [ENVIRONMENT]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  check       - Check prerequisites and authentication status"
    Write-Host "  auth        - Authenticate with Railway"
    Write-Host "  link        - Link to Railway project"
    Write-Host "  deploy      - Deploy to Railway (default: staging)"
    Write-Host "  vars        - Set environment variables"
    Write-Host "  full        - Complete setup and deployment"
    Write-Host "  help        - Show this help message"
    Write-Host ""
    Write-Host "Environments:" -ForegroundColor Yellow
    Write-Host "  staging     - Deploy to staging environment (default)"
    Write-Host "  production  - Deploy to production environment"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\scripts\deploy\setup.ps1 check"
    Write-Host "  .\scripts\deploy\setup.ps1 auth"
    Write-Host "  .\scripts\deploy\setup.ps1 deploy staging"
    Write-Host "  .\scripts\deploy\setup.ps1 full production"
    Write-Host ""
}

# =============================================================================
# Command Router
# =============================================================================

switch ($Command.ToLower()) {
    "check" {
        $prereqOk = Test-Prerequisites
        $authOk = Test-RailwayAuth
        
        if ($prereqOk -and $authOk) {
            Write-Success "All checks passed"
            exit 0
        } else {
            Write-Error "Some checks failed"
            exit 1
        }
    }
    
    "auth" {
        if (Connect-Railway) {
            exit 0
        } else {
            exit 1
        }
    }
    
    "link" {
        if (Connect-RailwayProject) {
            exit 0
        } else {
            exit 1
        }
    }
    
    "deploy" {
        if (Start-RailwayDeployment -Env $Environment) {
            exit 0
        } else {
            exit 1
        }
    }
    
    "vars" {
        if (Set-RailwayVariables -Env $Environment) {
            exit 0
        } else {
            exit 1
        }
    }
    
    "full" {
        Write-Header "Complete Deployment Setup"
        
        if (-not (Test-Prerequisites)) { exit 1 }
        if (-not (Test-RailwayAuth)) {
            if (-not (Connect-Railway)) { exit 1 }
        }
        if (-not (Connect-RailwayProject)) { exit 1 }
        if (-not (Set-RailwayVariables -Env $Environment)) { exit 1 }
        if (-not (Start-RailwayDeployment -Env $Environment)) { exit 1 }
        
        Write-Success "Complete deployment setup finished"
        exit 0
    }
    
    default {
        Show-Help
        exit 0
    }
}
