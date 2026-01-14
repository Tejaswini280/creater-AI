# Simple Railway Staging Deployment
# Uses the currently linked service

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Railway Staging Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check Railway CLI
Write-Host "Checking Railway CLI..." -ForegroundColor Yellow
$railwayVersion = railway --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Railway CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}
Write-Host "Railway CLI: $railwayVersion" -ForegroundColor Green
Write-Host ""

# Check authentication
Write-Host "Checking authentication..." -ForegroundColor Yellow
$authCheck = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated!" -ForegroundColor Red
    Write-Host "Please run: railway login" -ForegroundColor Yellow
    exit 1
}
Write-Host "Authenticated as: $authCheck" -ForegroundColor Green
Write-Host ""

# Check current status
Write-Host "Current Railway status:" -ForegroundColor Yellow
railway status
Write-Host ""

# Deploy
Write-Host "Starting deployment..." -ForegroundColor Yellow
Write-Host ""

railway up

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "  Deployment Successful!" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "View your deployment:" -ForegroundColor Cyan
    Write-Host "  https://railway.app/project/711091cc-10bf-41a3-87cf-8d058419de4f" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Check logs with:" -ForegroundColor Cyan
    Write-Host "  railway logs" -ForegroundColor Blue
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Red
    Write-Host "  Deployment Failed!" -ForegroundColor Red
    Write-Host "==================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Railway dashboard for errors" -ForegroundColor White
    Write-Host "2. View logs: railway logs" -ForegroundColor White
    Write-Host "3. Check service status: railway status" -ForegroundColor White
    Write-Host ""
    exit 1
}
