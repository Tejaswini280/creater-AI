#!/usr/bin/env pwsh

Write-Host "🔍 Listing Railway Services" -ForegroundColor Cyan
Write-Host ""

# First, link to the project
Write-Host "🔗 Linking to Railway project..." -ForegroundColor Yellow
railway link --project 711091cc-10bf-41a3-87cf-8d058419de4f

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link to Railway project" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Successfully linked" -ForegroundColor Green
Write-Host ""

# List all services
Write-Host "📋 Available services:" -ForegroundColor Cyan
railway service

Write-Host ""
Write-Host "💡 To deploy to a specific service, use:" -ForegroundColor Yellow
Write-Host "   railway up --service <service-id>" -ForegroundColor White
