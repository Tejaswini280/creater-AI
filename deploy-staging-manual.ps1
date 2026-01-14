# Manual Staging Deployment Script
# Use this if GitHub Actions is still having issues

Write-Host "🚀 Manual Railway Staging Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Railway configuration
$RAILWAY_TOKEN = "7bea4487-4542-4542-a02e-a40888c4b2b8"
$RAILWAY_PROJECT_ID = "711091cc-10bf-41a3-87cf-8d058419de4f"
$RAILWAY_STAGING_SERVICE_ID = "01abc727-2496-4948-95e7-c05f629936e8"

# Set environment variable
$env:RAILWAY_TOKEN = $RAILWAY_TOKEN

try {
    Write-Host "📦 Installing/updating Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli@latest
    
    Write-Host "🔐 Authenticating with Railway..." -ForegroundColor Yellow
    railway login --token $RAILWAY_TOKEN
    
    Write-Host "🔗 Linking to project..." -ForegroundColor Yellow
    railway link $RAILWAY_PROJECT_ID
    
    Write-Host "🏗️ Building and deploying to staging..." -ForegroundColor Yellow
    railway up --service $RAILWAY_STAGING_SERVICE_ID --detach
    
    Write-Host "✅ Staging deployment initiated!" -ForegroundColor Green
    Write-Host "🌐 Check Railway dashboard for deployment status" -ForegroundColor Cyan
    Write-Host "📊 Deployment URL will be available in Railway dashboard" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔍 Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check if Railway token is valid" -ForegroundColor Gray
    Write-Host "2. Verify project ID and service ID" -ForegroundColor Gray
    Write-Host "3. Ensure you have access to the Railway project" -ForegroundColor Gray
    Write-Host "4. Check Railway dashboard for any issues" -ForegroundColor Gray
}