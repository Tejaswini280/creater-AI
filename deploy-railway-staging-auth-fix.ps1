# Railway Staging Deployment with Authentication Fix
# Handles authentication and deploys to staging environment

$ErrorActionPreference = "Stop"

Write-Host "🚀 Railway Staging Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Constants
$RAILWAY_PROJECT_ID = "711091cc-10bf-41a3-87cf-8d058419de4f"
$STAGING_SERVICE_ID = "01abc727-2496-4948-95e7-c05f629936e8"
$PROD_SERVICE_ID = "db7499d8-fa40-476e-a943-9d62370bf3a8"

# Step 1: Check Railway CLI
Write-Host "📦 Checking Railway CLI..." -ForegroundColor Yellow
$railwayExists = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayExists) {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Railway CLI" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Railway CLI ready" -ForegroundColor Green
Write-Host ""

# Step 2: Check authentication
Write-Host "🔐 Checking authentication..." -ForegroundColor Yellow
$whoami = railway whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Not authenticated to Railway" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please authenticate first:" -ForegroundColor Cyan
    Write-Host "  Option 1: Run .\fix-railway-auth.ps1" -ForegroundColor White
    Write-Host "  Option 2: Run railway login" -ForegroundColor White
    Write-Host ""
    
    $response = Read-Host "Authenticate now? (Y/n)"
    if ($response -eq 'n' -or $response -eq 'N') {
        Write-Host "Deployment cancelled" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
    Write-Host "Opening browser for authentication..." -ForegroundColor Yellow
    railway login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Authentication failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Authenticated as: $whoami" -ForegroundColor Green
Write-Host ""

# Step 3: Link to project
Write-Host "🔗 Linking to Railway project..." -ForegroundColor Yellow
Write-Host "Project ID: $RAILWAY_PROJECT_ID" -ForegroundColor Cyan
Write-Host ""

# Use railway link with project ID
railway link $RAILWAY_PROJECT_ID 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Link command returned non-zero, but continuing..." -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Verify environment variables
Write-Host "🔍 Checking environment configuration..." -ForegroundColor Yellow

if (Test-Path ".env.staging") {
    Write-Host "✅ Found .env.staging" -ForegroundColor Green
    
    $response = Read-Host "Update Railway environment variables? (y/N)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "Updating variables..." -ForegroundColor Yellow
        
        Get-Content ".env.staging" | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                
                if ($key -and -not $key.StartsWith('#')) {
                    Write-Host "  Setting: $key" -ForegroundColor Cyan
                    railway variables --set "$key=$value" --environment $STAGING_ENV_ID 2>&1 | Out-Null
                }
            }
        }
        
        Write-Host "✅ Variables updated" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  .env.staging not found" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Deploy
Write-Host "🚀 Starting deployment to staging..." -ForegroundColor Yellow
Write-Host ""

# Deploy using railway up with explicit service
railway up --service $STAGING_SERVICE_ID

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "✅ Deployment initiated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Monitor deployment:" -ForegroundColor Yellow
    Write-Host "  https://railway.app/project/$RAILWAY_PROJECT_ID" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Check logs:" -ForegroundColor Yellow
    Write-Host "  railway logs --environment $STAGING_ENV_ID" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check authentication: railway whoami" -ForegroundColor White
    Write-Host "2. Verify project link: railway status" -ForegroundColor White
    Write-Host "3. Check logs: railway logs" -ForegroundColor White
    Write-Host "4. Re-authenticate: .\fix-railway-auth.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}
