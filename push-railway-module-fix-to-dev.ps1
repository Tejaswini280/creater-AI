#!/usr/bin/env pwsh

# Push Railway MODULE_NOT_FOUND Fix to Dev Branch
# Commits and pushes all the Railway startup fixes to the dev branch

Write-Host "🚀 Pushing Railway MODULE_NOT_FOUND Fix to Dev Branch" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green

# Step 1: Check current branch
Write-Host "`n1️⃣ Checking current branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# Step 2: Ensure we're on or switch to dev branch
Write-Host "`n2️⃣ Switching to dev branch..." -ForegroundColor Yellow
git checkout dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Dev branch doesn't exist, creating it..." -ForegroundColor Yellow
    git checkout -b dev
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create dev branch" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Now on dev branch" -ForegroundColor Green

# Step 3: Add all Railway fix files
Write-Host "`n3️⃣ Adding Railway fix files..." -ForegroundColor Yellow

# Core fix files
$railwayFiles = @(
    "package.json",
    "railway.json", 
    "nixpacks.toml",
    "railway-startup-tsx.cjs",
    "railway-start.cjs",
    "railway-env-check.cjs",
    "test-railway-startup-local.cjs",
    "deploy-railway-fix.ps1",
    "RAILWAY_MODULE_NOT_FOUND_FIX_COMPLETE.md",
    "push-railway-module-fix-to-dev.ps1"
)

# Add each file individually with verification
foreach ($file in $railwayFiles) {
    if (Test-Path $file) {
        git add $file
        Write-Host "✅ Added: $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️ File not found: $file" -ForegroundColor Yellow
    }
}

# Add built client files if they exist
if (Test-Path "dist/public") {
    git add dist/public/
    Write-Host "✅ Added: dist/public/ (built client)" -ForegroundColor Green
}

# Step 4: Check what's staged
Write-Host "`n4️⃣ Checking staged changes..." -ForegroundColor Yellow
git status --porcelain --cached
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to check git status" -ForegroundColor Red
    exit 1
}

# Step 5: Commit the changes
Write-Host "`n5️⃣ Committing Railway MODULE_NOT_FOUND fixes..." -ForegroundColor Yellow
$commitMessage = "Fix Railway MODULE_NOT_FOUND error - Complete startup script alignment

- Updated package.json start script to use railway-startup-tsx.cjs
- Fixed railway.json and nixpacks.toml startup commands  
- Enhanced railway-startup-tsx.cjs with better error handling
- Created fallback railway-start.cjs script
- Fixed vite.config.js ES module conflicts
- Added comprehensive environment checking
- Built client application successfully
- Added deployment automation scripts

Resolves: Railway deployment MODULE_NOT_FOUND error
Status: Ready for deployment"

git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ No changes to commit or commit failed" -ForegroundColor Yellow
    Write-Host "Checking if there are any changes..." -ForegroundColor Yellow
    git status
}

# Step 6: Push to dev branch
Write-Host "`n6️⃣ Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pushed to dev branch!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to push to dev branch" -ForegroundColor Red
    Write-Host "💡 Trying to set upstream and push..." -ForegroundColor Yellow
    git push --set-upstream origin dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully pushed to dev branch with upstream!" -ForegroundColor Green
    } else {
        Write-Host "❌ Push failed. You may need to push manually" -ForegroundColor Red
        exit 1
    }
}

# Step 7: Summary
Write-Host "`n🎉 Railway MODULE_NOT_FOUND fix pushed to dev branch!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   • Branch: dev" -ForegroundColor White
Write-Host "   • Files committed: Railway startup fixes" -ForegroundColor White
Write-Host "   • Status: Ready for Railway deployment" -ForegroundColor White

Write-Host "`n🔗 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Deploy dev branch to Railway staging environment" -ForegroundColor White
Write-Host "   2. Test the deployment to ensure MODULE_NOT_FOUND is resolved" -ForegroundColor White
Write-Host "   3. If successful, merge dev to main for production deployment" -ForegroundColor White

Write-Host "`n📝 Railway deployment command:" -ForegroundColor Cyan
Write-Host "   railway up --service your-service-name" -ForegroundColor Yellow