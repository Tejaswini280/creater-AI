# Test Railway Token
# Quick script to test if your Railway token works

Write-Host "Testing Railway Token..." -ForegroundColor Cyan
Write-Host ""

# Set the token
$env:RAILWAY_TOKEN = "7bea4487-4942-4542-a02e-a40888c4b2b8"

# Test authentication
Write-Host "Testing authentication..." -ForegroundColor Yellow
$result = railway whoami 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Token is valid!" -ForegroundColor Green
    Write-Host "User: $result" -ForegroundColor Cyan
    Write-Host ""
    
    # Test project linking
    Write-Host "Testing project link..." -ForegroundColor Yellow
    railway link 711091cc-10bf-41a3-87cf-8d058419de4f
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Project linked successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You're ready to deploy!" -ForegroundColor Green
        Write-Host "Run: .\deploy-railway-staging-auth-fix.ps1" -ForegroundColor White
    } else {
        Write-Host "❌ Project linking failed" -ForegroundColor Red
        Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Token authentication failed" -ForegroundColor Red
    Write-Host "Error: $result" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Token may have expired" -ForegroundColor White
    Write-Host "2. Token may have been revoked" -ForegroundColor White
    Write-Host "3. Network connectivity issues" -ForegroundColor White
    Write-Host ""
    Write-Host "Try:" -ForegroundColor Yellow
    Write-Host "1. Generate a new token: https://railway.app/account/tokens" -ForegroundColor White
    Write-Host "2. Use browser login: railway login" -ForegroundColor White
}

Write-Host ""
