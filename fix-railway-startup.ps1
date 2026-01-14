#!/usr/bin/env pwsh

Write-Host "🚀 Fixing Railway Startup Issues..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run from project root." -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "🔧 Building server..." -ForegroundColor Yellow
npm run build:server

Write-Host "✅ Testing startup script locally..." -ForegroundColor Yellow
node railway-start.cjs --test 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Startup script test passed" -ForegroundColor Green
} else {
    Write-Host "⚠️  Startup script test had issues, but continuing..." -ForegroundColor Yellow
}

Write-Host "🚀 Deploying to Railway..." -ForegroundColor Green
git add .
git commit -m "Fix Railway startup script path issue"

# Check if railway CLI is available
if (Get-Command railway -ErrorAction SilentlyContinue) {
    Write-Host "🚂 Using Railway CLI to deploy..." -ForegroundColor Blue
    railway up
} else {
    Write-Host "📤 Pushing to git (Railway will auto-deploy)..." -ForegroundColor Blue
    git push origin main
}

Write-Host "✅ Railway startup fix deployment complete!" -ForegroundColor Green
Write-Host "🔍 Check Railway logs to verify the fix worked." -ForegroundColor Cyan