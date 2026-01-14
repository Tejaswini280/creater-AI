# Test Railway CLI with the correct positional argument syntax
Write-Host "Testing Railway CLI with fixed syntax..." -ForegroundColor Cyan

$RAILWAY_TOKEN = "7bea4487-4542-4542-a02e-a40888c4b2b8"
$RAILWAY_PROJECT_ID = "711091cc-10bf-41a3-87cf-8d058419de4f"
$RAILWAY_STAGING_SERVICE_ID = "01abc727-2496-4948-95e7-c05f629936e8"

# Set environment variable for Railway token
$env:RAILWAY_TOKEN = $RAILWAY_TOKEN

try {
    Write-Host "Setting Railway token..." -ForegroundColor Yellow
    
    Write-Host "Linking to Railway project with positional arguments..." -ForegroundColor Yellow
    # Use positional arguments instead of --project and --service flags
    railway link $RAILWAY_PROJECT_ID $RAILWAY_STAGING_SERVICE_ID
    
    Write-Host "SUCCESS: Railway link command worked!" -ForegroundColor Green
    Write-Host "Ready to deploy with: railway up --detach" -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}