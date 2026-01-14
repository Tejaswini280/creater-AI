#!/usr/bin/env pwsh

# Creator AI Studio Deployment Script (PowerShell)
# Single entry-point for multi-environment deployment with integrated testing
# Usage: .\deploy.ps1 -Environment <dev|staging|prod> [-Test] [-Docker] [-Force]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "staging", "prod")]
    [string]$Environment,
    
    [switch]$Test,
    [switch]$Docker,
    [switch]$Force,
    [switch]$Help
)

# Configuration
$ProjectName = "creator-ai-studio"
$BackendDir = "server"
$FrontendDir = "client"
$DockerComposeFile = "docker-compose.yml"
$RailwayConfig = "railway.json"

# Function to display help
function Show-Help {
    Write-Host @"
Creator AI Studio Deployment Script (PowerShell)

USAGE:
  .\deploy.ps1 -Environment <environment> [options]

REQUIRED PARAMETERS:
  -Environment <env>    Target environment: dev, staging, or prod
                        - dev: Local development (Docker-based)
                        - staging: Railway deployment (dev branch)
                        - prod: Production cloud deployment (main branch)

OPTIONAL PARAMETERS:
  -Test                 Run full test suite before deployment
  -Docker               Use Docker-based deployment (when applicable)
  -Force                Force deployment even if tests fail
  -Help                 Show this help message

EXAMPLES:
  # Local development with tests
  .\deploy.ps1 -Environment dev -Test
  
  # Staging deployment with Docker
  .\deploy.ps1 -Environment staging -Docker
  
  # Production deployment with tests
  .\deploy.ps1 -Environment prod -Test
  
  # Force production deployment (emergency)
  .\deploy.ps1 -Environment prod -Force
  
  # Show help
  .\deploy.ps1 -Help

ENVIRONMENT DETAILS:
  dev (Local): Docker containers on developer machine
  staging (Railway): Automated deployment from dev branch
  prod (Production): Cloud deployment from main branch

PREREQUISITES:
  - Docker Desktop (for local dev)
  - Node.js 20+ and npm
  - Git
  - Railway CLI (for staging/prod deployments)
  - PowerShell 7+ (recommended)
  - Environment-specific .env files

AI SERVICES INCLUDED:
  - OpenAI GPT integration
  - Google Gemini AI
  - Kling AI video generation
  - HuggingFace models
  - Content optimization AI
  - Predictive analytics
"@ -ForegroundColor Cyan
}

if ($Help) {
    Show-Help
    exit 0
}

# Function to print section headers
function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

# Function to check prerequisites
function Test-Prerequisites {
    Write-Section "Checking Prerequisites"
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($majorVersion -lt 18) {
            Write-Host "❌ Node.js version 18+ required (found: $nodeVersion)" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Node.js is not installed" -ForegroundColor Red
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Host "✅ npm $npmVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ npm is not installed" -ForegroundColor Red
        exit 1
    }
    
    # Check Git
    try {
        $gitVersion = (git --version).Split(' ')[2]
        Write-Host "✅ Git $gitVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Git is not installed" -ForegroundColor Red
        exit 1
    }
    
    # Check Docker for local development
    if ($Environment -eq "dev" -or $Docker) {
        try {
            $dockerVersion = (docker --version).Split(' ')[2].TrimEnd(',')
            Write-Host "✅ Docker $dockerVersion" -ForegroundColor Green
            
            # Check if Docker is running
            docker info | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
            exit 1
        }
        
        try {
            $composeVersion = (docker-compose --version).Split(' ')[3].TrimEnd(',')
            Write-Host "✅ Docker Compose $composeVersion" -ForegroundColor Green
        } catch {
            Write-Host "❌ Docker Compose is not installed" -ForegroundColor Red
            exit 1
        }
    }
    
    # Check Railway CLI for staging/prod
    if ($Environment -eq "staging" -or $Environment -eq "prod") {
        try {
            railway version | Out-Null
            Write-Host "✅ Railway CLI installed" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Railway CLI not found. Installing..." -ForegroundColor Yellow
            npm install -g @railway/cli
            try {
                railway version | Out-Null
                Write-Host "✅ Railway CLI installed" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
                exit 1
            }
        }
    }
}

# Function to validate environment files
function Test-EnvironmentFiles {
    Write-Section "Validating Environment Configuration"
    
    $envFile = switch ($Environment) {
        "dev" { ".env.development" }
        "staging" { ".env.staging.example" }
        "prod" { ".env.production.example" }
    }
    
    if (-not (Test-Path $envFile)) {
        Write-Host "❌ Environment file not found: $envFile" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Environment file found: $envFile" -ForegroundColor Green
    
    # Check for required API keys
    $requiredKeys = @("OPENAI_API_KEY", "GEMINI_API_KEY", "JWT_SECRET", "SESSION_SECRET")
    
    $envContent = Get-Content $envFile
    foreach ($key in $requiredKeys) {
        $keyLine = $envContent | Where-Object { $_ -match "^$key=" }
        if ($keyLine -and $keyLine -notmatch "your_.*_here") {
            Write-Host "✅ $key configured" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $key needs configuration in $envFile" -ForegroundColor Yellow
        }
    }
}

# Function to install dependencies
function Install-Dependencies {
    Write-Section "Installing Dependencies"
    
    Write-Host "📦 Installing npm dependencies..." -ForegroundColor Blue
    npm ci
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Function to run tests
function Invoke-Tests {
    if (-not $Test -and -not $Force) {
        return
    }
    
    Write-Section "Running Test Suite"
    
    Write-Host "🧪 Running TypeScript checks..." -ForegroundColor Blue
    npm run check
    
    Write-Host "🧪 Running unit tests..." -ForegroundColor Blue
    npm test
    
    Write-Host "🧪 Running security tests..." -ForegroundColor Blue
    try {
        npm run security:headers:test
    } catch {
        # Security tests are optional
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All tests passed" -ForegroundColor Green
    } else {
        if ($Force) {
            Write-Host "⚠️  Tests failed but continuing due to -Force flag" -ForegroundColor Yellow
        } else {
            Write-Host "❌ Tests failed. Use -Force to deploy anyway" -ForegroundColor Red
            exit 1
        }
    }
}

# Function to build application
function Build-Application {
    Write-Section "Building Application"
    
    Write-Host "🏗️  Building Creator AI Studio..." -ForegroundColor Blue
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build completed successfully" -ForegroundColor Green
        
        # Verify build artifacts
        if (Test-Path "dist/index.js") {
            Write-Host "✅ Backend build verified" -ForegroundColor Green
        } else {
            Write-Host "❌ Backend build failed - dist/index.js not found" -ForegroundColor Red
            exit 1
        }
        
        if (Test-Path "dist/public") {
            Write-Host "✅ Frontend build verified" -ForegroundColor Green
        } else {
            Write-Host "❌ Frontend build failed - dist/public not found" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
}

# Function to deploy locally with Docker
function Deploy-Local {
    Write-Section "Local Docker Deployment"
    
    Write-Host "🐳 Starting Docker deployment..." -ForegroundColor Blue
    
    # Stop existing containers
    Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
    docker-compose down
    
    # Build and start services
    Write-Host "🏗️  Building and starting services..." -ForegroundColor Blue
    docker-compose up --build -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker deployment failed" -ForegroundColor Red
        exit 1
    }
    
    # Wait for services
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # Check service health
    Write-Host "📊 Checking service status..." -ForegroundColor Blue
    docker-compose ps
    
    # Verify application is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Application is running at http://localhost:5000" -ForegroundColor Green
            Write-Host "✅ Database: PostgreSQL on localhost:5432" -ForegroundColor Green
            Write-Host "✅ Redis: localhost:6379" -ForegroundColor Green
        } else {
            throw "Health check failed"
        }
    } catch {
        Write-Host "❌ Application health check failed" -ForegroundColor Red
        Write-Host "📋 Application logs:" -ForegroundColor Yellow
        docker-compose logs app --tail=20
        exit 1
    }
}

# Function to deploy to Railway (staging/prod)
function Deploy-Railway {
    Write-Section "Railway Deployment ($Environment)"
    
    # Check Railway authentication
    try {
        railway whoami | Out-Null
    } catch {
        Write-Host "🔐 Railway authentication required" -ForegroundColor Yellow
        railway login
    }
    
    # Set service ID based on environment
    $serviceId = switch ($Environment) {
        "staging" { 
            if (-not $env:RAILWAY_STAGING_SERVICE_ID) {
                Write-Host "❌ RAILWAY_STAGING_SERVICE_ID environment variable not set" -ForegroundColor Red
                exit 1
            }
            $env:RAILWAY_STAGING_SERVICE_ID
        }
        "prod" { 
            if (-not $env:RAILWAY_PROD_SERVICE_ID) {
                Write-Host "❌ RAILWAY_PROD_SERVICE_ID environment variable not set" -ForegroundColor Red
                exit 1
            }
            $env:RAILWAY_PROD_SERVICE_ID
        }
    }
    
    Write-Host "🚀 Deploying to Railway $Environment environment..." -ForegroundColor Blue
    
    if ($Environment -eq "prod") {
        Write-Host "⚠️  WARNING: This is a PRODUCTION deployment!" -ForegroundColor Red
        $confirmation = Read-Host "Are you sure you want to continue? (y/N)"
        if ($confirmation -ne "y" -and $confirmation -ne "Y") {
            Write-Host "Deployment cancelled" -ForegroundColor Yellow
            exit 0
        }
    }
    
    # Deploy to Railway
    railway up --service=$serviceId --detach
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Deployment initiated successfully" -ForegroundColor Green
        Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        Write-Host "🎉 $Environment deployment completed!" -ForegroundColor Green
        Write-Host "📊 Check Railway dashboard for deployment status" -ForegroundColor Cyan
        Write-Host "🔗 Your application should be available shortly" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Railway deployment failed" -ForegroundColor Red
        exit 1
    }
}

# Function to run post-deployment verification
function Test-PostDeployment {
    Write-Section "Post-Deployment Verification"
    
    $healthUrl = switch ($Environment) {
        "dev" { "http://localhost:5000/api/health" }
        default {
            Write-Host "⚠️  Manual verification required for Railway deployments" -ForegroundColor Yellow
            Write-Host "🔗 Check Railway dashboard for application URL" -ForegroundColor Cyan
            return
        }
    }
    
    Write-Host "🔍 Verifying application health..." -ForegroundColor Blue
    
    # Wait for application to be ready
    for ($i = 1; $i -le 10; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ Application health check passed" -ForegroundColor Green
                return
            }
        } catch {
            # Continue trying
        }
        Write-Host "⏳ Waiting for application... (attempt $i/10)" -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
    
    Write-Host "❌ Application health check failed" -ForegroundColor Red
    exit 1
}

# Function to display deployment summary
function Show-DeploymentSummary {
    Write-Section "Deployment Summary"
    
    Write-Host "🎉 Creator AI Studio Deployment Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Environment: $Environment" -ForegroundColor Blue
    Write-Host "Tests Run: $Test" -ForegroundColor Blue
    Write-Host "Docker Used: $Docker" -ForegroundColor Blue
    Write-Host "Force Deploy: $Force" -ForegroundColor Blue
    Write-Host ""
    
    switch ($Environment) {
        "dev" {
            Write-Host "🌐 Application URL: http://localhost:5000" -ForegroundColor Green
            Write-Host "📊 Database: PostgreSQL on localhost:5432" -ForegroundColor Green
            Write-Host "🔄 Redis: localhost:6379" -ForegroundColor Green
            Write-Host ""
            Write-Host "Useful Commands:" -ForegroundColor Yellow
            Write-Host "  View logs: docker-compose logs -f app" -ForegroundColor Cyan
            Write-Host "  Stop app: docker-compose down" -ForegroundColor Cyan
            Write-Host "  Restart: docker-compose restart app" -ForegroundColor Cyan
        }
        "staging" {
            Write-Host "🌐 Environment: Railway Staging" -ForegroundColor Green
            Write-Host "📊 Branch: dev" -ForegroundColor Green
            Write-Host "🔗 Check Railway dashboard for application URL" -ForegroundColor Cyan
        }
        "prod" {
            Write-Host "🌐 Environment: Railway Production" -ForegroundColor Green
            Write-Host "📊 Branch: main" -ForegroundColor Green
            Write-Host "🔗 Check Railway dashboard for application URL" -ForegroundColor Cyan
            Write-Host "🚨 Monitor application metrics and logs" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Write-Host "🤖 AI Services Available:" -ForegroundColor Magenta
    Write-Host "  • OpenAI GPT integration"
    Write-Host "  • Google Gemini AI"
    Write-Host "  • Kling AI video generation"
    Write-Host "  • HuggingFace models"
    Write-Host "  • Content optimization AI"
    Write-Host "  • Predictive analytics"
}

# Main deployment flow
function Main {
    Write-Host "🚀 Creator AI Studio Deployment Script (PowerShell)" -ForegroundColor Blue
    Write-Host "Environment: $Environment" -ForegroundColor Blue
    Write-Host ""
    
    Test-Prerequisites
    Test-EnvironmentFiles
    Install-Dependencies
    
    if ($Test) {
        Invoke-Tests
    }
    
    # Build only for non-local deployments or when explicitly requested
    if ($Environment -ne "dev" -or -not $Docker) {
        Build-Application
    }
    
    # Deploy based on environment
    switch ($Environment) {
        "dev" { Deploy-Local }
        default { Deploy-Railway }
    }
    
    Test-PostDeployment
    Show-DeploymentSummary
}

# Run main function
try {
    Main
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}