# Test Railway Connection
Write-Host "Testing Railway CLI connection..." -ForegroundColor Cyan

# Railway configuration from your GitHub secrets
$RAILWAY_TOKEN = "7bea4487-4542-4542-a02e-a40888c4b2b8"
$RAILWAY_PROJECT_ID = "711091cc-10bf-41a3-87cf-8d058419de4f"
$RAILWAY_STAGING_SERVICE_ID = "01abc727-2496-4948-95e7-c05f629936e8"

# Set environment variable
$env:RAILWAY_TOKEN = $RAILWAY_TOKEN

try {
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli@latest
    
    Write-Host "Testing Railway login..." -ForegroundColor Yellow
    railway login --token $RAILWAY_TOKEN
    
    Write-Host "Testing project link..." -ForegroundColor Yellow
    railway link $RAILWAY_PROJECT_ID
    
    Write-Host "SUCCESS: Railway connection works!" -ForegroundColor Green
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}