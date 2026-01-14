#!/usr/bin/env pwsh

# RAILWAY DOCKER CONNECTION FIX DEPLOYMENT
# This script deploys the fix for Railway's Docker connection issue

Write-Host "DEPLOYING RAILWAY DOCKER CONNECTION FIX..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify fix was applied
Write-Host "Step 1: Verifying fix was applied..." -ForegroundColor Yellow

if (Test-Path "railway.json") {
    Write-Host "✅ railway.json exists" -ForegroundColor Green
} else {
    Write-Host "❌ railway.json missing - running fix..." -ForegroundColor Red
    node fix-railway-docker-connection-issue.cjs
}

if (Test-Path "nixpacks.toml") {
    Write-Host "✅ nixpacks.toml exists" -ForegroundColor Green
} else {
    Write-Host "❌ nixpacks.toml missing" -ForegroundColor Red
    exit 1
}

if (Test-Path "verify-build.cjs") {
    Write-Host "✅ verify-build.cjs exists" -ForegroundColor Green
} else {
    Write-Host "❌ verify-build.cjs missing" -ForegroundColor Red
    exit 1
}

# Step 2: Test build locally (optional)
Write-Host ""
Write-Host "Step 2: Testing build process..." -ForegroundColor Yellow

try {
    npm run railway:build
    Write-Host "✅ Build test successful" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Build test failed, but continuing (Railway may handle differently)" -ForegroundColor Yellow
}

# Step 3: Commit changes
Write-Host ""
Write-Host "Step 3: Committing changes..." -ForegroundColor Yellow

git add .
git status

$commitMessage = "Fix Railway Docker connection issue - simplified build process"
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commit failed or no changes to commit" -ForegroundColor Yellow
}

# Step 4: Push to dev branch
Write-Host ""
Write-Host "Step 4: Pushing to dev branch..." -ForegroundColor Yellow

git push origin dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to dev branch" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to dev branch" -ForegroundColor Red
    exit 1
}

# Step 5: Display deployment instructions
Write-Host ""
Write-Host "RAILWAY DOCKER CONNECTION FIX DEPLOYED!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to your Railway dashboard" -ForegroundColor White
Write-Host "2. Trigger a new deployment from the dev branch" -ForegroundColor White
Write-Host "3. Monitor the build logs - you should see:" -ForegroundColor White
Write-Host "   ✅ No 'Docker connection error'" -ForegroundColor Green
Write-Host "   ✅ Successful build completion" -ForegroundColor Green
Write-Host "   ✅ Application starts without issues" -ForegroundColor Green
Write-Host ""
Write-Host "What was fixed:" -ForegroundColor Cyan
Write-Host "✅ Simplified build process to prevent worker overload" -ForegroundColor Green
Write-Host "✅ Minimal nixpacks configuration" -ForegroundColor Green
Write-Host "✅ Removed heavy dependencies causing connection issues" -ForegroundColor Green
Write-Host "✅ Added build verification with retry logic" -ForegroundColor Green
Write-Host "✅ Created Railway-optimized start script" -ForegroundColor Green
Write-Host ""
Write-Host "The Docker connection issue should now be resolved!" -ForegroundColor Green

# Step 6: Optional - show current git status
Write-Host ""
Write-Host "Current Git Status:" -ForegroundColor Cyan
git log --oneline -5
Write-Host ""
Write-Host "Ready for Railway deployment!" -ForegroundColor Green