#!/usr/bin/env pwsh

# Fix Railway Vite Build Issue
# This script fixes the "vite: not found" error in Railway deployment

Write-Host "🔧 Fixing Railway Vite Build Issue..." -ForegroundColor Cyan

# Verify the fixes are in place
Write-Host "✅ Checking package.json railway:start script..." -ForegroundColor Green
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.scripts."railway:start" -eq "npm run start") {
    Write-Host "   ✓ railway:start script correctly set to 'npm run start'" -ForegroundColor Green
}
else {
    Write-Host "   ❌ railway:start script needs to be fixed" -ForegroundColor Red
    exit 1
}

# Check nixpacks.toml
Write-Host "✅ Checking nixpacks.toml start command..." -ForegroundColor Green
$nixpacksContent = Get-Content "nixpacks.toml" -Raw
if ($nixpacksContent -match 'cmd = "npm run start"') {
    Write-Host "   ✓ nixpacks start command correctly set" -ForegroundColor Green
}
else {
    Write-Host "   ❌ nixpacks start command needs to be fixed" -ForegroundColor Red
    exit 1
}

# Check railway.json
Write-Host "✅ Checking railway.json deploy command..." -ForegroundColor Green
$railwayJson = Get-Content "railway.json" | ConvertFrom-Json
if ($railwayJson.deploy.startCommand -eq "npm run start") {
    Write-Host "   ✓ railway deploy startCommand correctly set" -ForegroundColor Green
}
else {
    Write-Host "   ❌ railway deploy startCommand needs to be fixed" -ForegroundColor Red
    exit 1
}

# Test local build
Write-Host "🔨 Testing local build..." -ForegroundColor Cyan
$buildResult = & npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Local build successful" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Local build failed" -ForegroundColor Red
    Write-Host $buildResult
    exit 1
}

Write-Host "🎉 Railway Vite build issue fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary of changes:" -ForegroundColor Yellow
Write-Host "• Fixed package.json railway:start script to avoid double build" -ForegroundColor White
Write-Host "• Updated nixpacks.toml to use correct start command" -ForegroundColor White
Write-Host "• Updated railway.json to use correct deploy command" -ForegroundColor White
Write-Host ""
Write-Host "The build process now works as follows:" -ForegroundColor Yellow
Write-Host "1. Railway runs 'npm ci' to install dependencies" -ForegroundColor White
Write-Host "2. Railway runs 'npm run build' to build the application" -ForegroundColor White
Write-Host "3. Railway runs 'npm run start' to start the production server" -ForegroundColor White
Write-Host ""
Write-Host "Ready for Railway deployment! 🚀" -ForegroundColor Green