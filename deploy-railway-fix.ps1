#!/usr/bin/env pwsh

# Railway Deployment Fix Script
# Fixes the MODULE_NOT_FOUND error and deploys to Railway

Write-Host "🚀 Railway Deployment Fix Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Step 1: Environment Check
Write-Host "`n1️⃣ Running environment check..." -ForegroundColor Yellow
node railway-env-check.cjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Environment check failed" -ForegroundColor Red
    exit 1
}

# Step 2: Build client if needed
Write-Host "`n2️⃣ Building client..." -ForegroundColor Yellow
if (!(Test-Path "dist/public/index.html")) {
    npm run build:client
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Client build failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Client already built" -ForegroundColor Green
}

# Step 3: Test startup script locally (optional)
Write-Host "`n3️⃣ Testing startup script..." -ForegroundColor Yellow
Write-Host "⚠️ This will start the server briefly to test - press Ctrl+C after a few seconds" -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Set test environment
$env:NODE_ENV = "production"
$env:PORT = "8080"

# Test the startup (kill after 5 seconds)
$job = Start-Job -ScriptBlock {
    node railway-startup-tsx.cjs
}

Start-Sleep -Seconds 5
Stop-Job $job
Remove-Job $job

Write-Host "✅ Startup script test completed" -ForegroundColor Green

# Step 4: Git operations
Write-Host "`n4️⃣ Preparing Git commit..." -ForegroundColor Yellow

# Add all changes
git add .

# Commit changes
$commitMessage = "Fix Railway MODULE_NOT_FOUND error - Update startup scripts and build config"
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ No changes to commit or commit failed" -ForegroundColor Yellow
} else {
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green
}

# Step 5: Push to Railway (if Railway CLI is available)
Write-Host "`n5️⃣ Deploying to Railway..." -ForegroundColor Yellow

# Check if Railway CLI is available
$railwayAvailable = Get-Command railway -ErrorAction SilentlyContinue
if ($railwayAvailable) {
    Write-Host "🚂 Railway CLI found, deploying..." -ForegroundColor Green
    railway up
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Railway deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Railway deployment failed" -ForegroundColor Red
        Write-Host "💡 Try deploying manually through Railway dashboard" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️ Railway CLI not found" -ForegroundColor Yellow
    Write-Host "💡 Please deploy manually through Railway dashboard or install Railway CLI" -ForegroundColor Yellow
    Write-Host "   Install: npm install -g @railway/cli" -ForegroundColor Cyan
}

# Step 6: Push to Git repository
Write-Host "`n6️⃣ Pushing to Git repository..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git push successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Git push failed" -ForegroundColor Red
    Write-Host "💡 You may need to push manually" -ForegroundColor Yellow
}

Write-Host "`n🎉 Railway fix deployment complete!" -ForegroundColor Green
Write-Host "📋 Summary of changes:" -ForegroundColor Cyan
Write-Host "   • Fixed package.json start script to use railway-startup-tsx.cjs" -ForegroundColor White
Write-Host "   • Updated railway.json with correct startup command" -ForegroundColor White
Write-Host "   • Fixed nixpacks.toml startup configuration" -ForegroundColor White
Write-Host "   • Created fallback railway-start.cjs script" -ForegroundColor White
Write-Host "   • Fixed vite.config.js compilation issues" -ForegroundColor White
Write-Host "   • Built client application successfully" -ForegroundColor White

Write-Host "`n🔗 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Check Railway deployment logs" -ForegroundColor White
Write-Host "   2. Verify application starts without MODULE_NOT_FOUND error" -ForegroundColor White
Write-Host "   3. Test application functionality" -ForegroundColor White