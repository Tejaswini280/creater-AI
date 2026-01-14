#!/usr/bin/env pwsh

Write-Host "🚀 Deploying to Railway" -ForegroundColor Cyan
Write-Host ""

# Link to the project
Write-Host "🔗 Linking to Railway project..." -ForegroundColor Yellow
railway link --project 711091cc-10bf-41a3-87cf-8d058419de4f

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link to Railway project" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Try running: railway login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Successfully linked" -ForegroundColor Green
Write-Host ""

# Deploy to the current/default service
Write-Host "📦 Deploying to Railway..." -ForegroundColor Cyan
Write-Host "   (This will deploy to the currently selected service)" -ForegroundColor Gray
Write-Host ""

railway up

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if you're logged in: railway whoami" -ForegroundColor White
    Write-Host "   2. List available services: .\list-railway-services.ps1" -ForegroundColor White
    Write-Host "   3. Deploy to specific service: railway up --service <service-id>" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Check your Railway dashboard for deployment status" -ForegroundColor Cyan
Write-Host "   https://railway.app/project/711091cc-10bf-41a3-87cf-8d058419de4f" -ForegroundColor White
