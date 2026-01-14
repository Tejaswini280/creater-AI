#!/usr/bin/env pwsh

Write-Host "🚀 Deploying to Railway staging environment..." -ForegroundColor Cyan

# Check if RAILWAY_TOKEN is set
if (-not $env:RAILWAY_TOKEN) {
    Write-Host "❌ Error: RAILWAY_TOKEN environment variable is not set" -ForegroundColor Red
    Write-Host "Please set it with: `$env:RAILWAY_TOKEN='your-token'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🔐 Railway authentication configured via environment variable" -ForegroundColor Green

# Verify Railway CLI authentication
Write-Host "🔍 Verifying Railway CLI authentication..." -ForegroundColor Cyan
railway whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Railway authentication check failed, but continuing with token..." -ForegroundColor Yellow
}

Write-Host "🔗 Linking to Railway project and service..." -ForegroundColor Cyan

# Link to project using the correct flag syntax
railway link --project 711091cc-10bf-41a3-87cf-8d058419de4f
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link to Railway project" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Starting deployment to staging..." -ForegroundColor Cyan

# Deploy to specific service in staging environment
railway up --service 01abc727-2496-4948-95e7-c05f629936e8
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment initiated successfully!" -ForegroundColor Green
Write-Host "🌐 Check your Railway dashboard for deployment status" -ForegroundColor Cyan
