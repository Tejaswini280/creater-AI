# Deploy to Railway Staging - Local Script
# This script deploys to Railway staging environment from your local machine

Write-Host "🚀 Railway Staging Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "711091cc-10bf-41a3-87cf-8d058419de4f"
$STAGING_SERVICE_NAME = "Creator-Dev-Server"  # Use service name instead of ID

# Step 1: Check Railway CLI
Write-Host "📋 Checking Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version 2>&1
    Write-Host "✅ Railway CLI installed: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check authentication
Write-Host ""
Write-Host "🔐 Checking Railway authentication..." -ForegroundColor Yellow
$authCheck = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with Railway" -ForegroundColor Red
    Write-Host "Please run: railway login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Authenticated as: $authCheck" -ForegroundColor Green

# Step 3: Link to project
Write-Host ""
Write-Host "🔗 Linking to Railway project..." -ForegroundColor Yellow
railway link --project $PROJECT_ID
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link to project" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Linked to project: $PROJECT_ID" -ForegroundColor Green

# Step 4: Deploy to staging service
Write-Host ""
Write-Host "📦 Deploying to staging service..." -ForegroundColor Yellow
Write-Host "Service: $STAGING_SERVICE_NAME" -ForegroundColor Cyan

# Deploy using service name
railway up --service $STAGING_SERVICE_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 View your deployment:" -ForegroundColor Cyan
    Write-Host "   https://railway.app/project/$PROJECT_ID" -ForegroundColor Blue
    Write-Host ""
    Write-Host "📊 Check logs with:" -ForegroundColor Cyan
    Write-Host "   railway logs --service $STAGING_SERVICE_NAME" -ForegroundColor Blue
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if service name is correct" -ForegroundColor White
    Write-Host "2. Verify you have permissions for this project" -ForegroundColor White
    Write-Host "3. Check Railway dashboard for errors" -ForegroundColor White
    exit 1
}
