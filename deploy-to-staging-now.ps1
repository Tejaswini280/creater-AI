#!/usr/bin/env pwsh

Write-Host "🚀 Deploying to Railway Staging Environment" -ForegroundColor Cyan
Write-Host ""

# Check if RAILWAY_TOKEN is set
if (-not $env:RAILWAY_TOKEN) {
    Write-Host "❌ RAILWAY_TOKEN environment variable is not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set your Railway token:" -ForegroundColor Yellow
    Write-Host "  `$env:RAILWAY_TOKEN = 'your-token-here'" -ForegroundColor White
    Write-Host ""
    Write-Host "You can get your token from:" -ForegroundColor Yellow
    Write-Host "  https://railway.app/account/tokens" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Railway token found" -ForegroundColor Green
Write-Host ""

# Link to the project
Write-Host "🔗 Linking to Railway project..." -ForegroundColor Cyan
railway link --project 711091cc-10bf-41a3-87cf-8d058419de4f

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link to Railway project" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully linked to project" -ForegroundColor Green
Write-Host ""

# Deploy to staging service
Write-Host "📦 Deploying to staging service..." -ForegroundColor Cyan
railway up --service c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Check your Railway dashboard for deployment status" -ForegroundColor Cyan
Write-Host "   https://railway.app/project/711091cc-10bf-41a3-87cf-8d058419de4f" -ForegroundColor White
