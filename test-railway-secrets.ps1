# Test Railway Secrets and Connection
# This script tests if Railway CLI can connect with your GitHub secrets

Write-Host "🔍 Testing Railway CLI connection..." -ForegroundColor Cyan

# Check if Railway CLI is installed
try {
    $railwayVersion = railway --version
    Write-Host "✅ Railway CLI installed: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli@latest
}

# Test values (these should match your GitHub secrets)
$RAILWAY_TOKEN = "7bea4487-4542-4542-a02e-a40888c4b2b8"
$RAILWAY_PROJECT_ID = "711091cc-10bf-41a3-87cf-8d058419de4f"
$RAILWAY_STAGING_SERVICE_ID = "01abc727-2496-4948-95e7-c05f629936e8"

Write-Host "🔐 Testing Railway authentication..." -ForegroundColor Cyan

# Set environment variable
$env:RAILWAY_TOKEN = $RAILWAY_TOKEN

try {
    # Test login
    Write-Host "Logging in to Railway..." -ForegroundColor Yellow
    railway login --token $RAILWAY_TOKEN
    
    Write-Host "✅ Railway login successful!" -ForegroundColor Green
    
    # Test project link
    Write-Host "🔗 Testing project link..." -ForegroundColor Yellow
    railway link $RAILWAY_PROJECT_ID
    
    Write-Host "✅ Project link successful!" -ForegroundColor Green
    
    # Test service listing
    Write-Host "📋 Listing services..." -ForegroundColor Yellow
    railway service list
    
    Write-Host "✅ All Railway CLI tests passed!" -ForegroundColor Green
    Write-Host "🚀 Your GitHub Actions deployment should work now." -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Railway CLI test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Check if your Railway token is valid and has access to the project." -ForegroundColor Yellow
}

Write-Host "`n📝 GitHub Secrets should be configured as:" -ForegroundColor Cyan
Write-Host "RAILWAY_TOKEN: $RAILWAY_TOKEN" -ForegroundColor Gray
Write-Host "RAILWAY_PROJECT_ID: $RAILWAY_PROJECT_ID" -ForegroundColor Gray
Write-Host "RAILWAY_STAGING_SERVICE_ID: $RAILWAY_STAGING_SERVICE_ID" -ForegroundColor Gray