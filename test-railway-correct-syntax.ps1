# Test Railway CLI with correct syntax
Write-Host "Testing Railway CLI with correct syntax..." -ForegroundColor Cyan

$RAILWAY_TOKEN = "7bea4487-4542-4542-a02e-a40888c4b2b8"
$RAILWAY_PROJECT_ID = "711091cc-10bf-41a3-87cf-8d058419de4f"
$RAILWAY_STAGING_SERVICE_ID = "01abc727-2496-4948-95e7-c05f629936e8"

try {
    Write-Host "Setting up Railway authentication..." -ForegroundColor Yellow
    echo $RAILWAY_TOKEN | railway login --browserless
    
    Write-Host "Linking to project and service..." -ForegroundColor Yellow
    railway link --project $RAILWAY_PROJECT_ID --service $RAILWAY_STAGING_SERVICE_ID
    
    Write-Host "SUCCESS: Railway setup complete!" -ForegroundColor Green
    Write-Host "You can now run 'railway up --detach' to deploy" -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}