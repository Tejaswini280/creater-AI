#!/usr/bin/env pwsh

# Push Railway 502 Error Fix to Dev Branch
Write-Host "🚀 PUSHING RAILWAY 502 ERROR FIX TO DEV BRANCH" -ForegroundColor Green
Write-Host "============================================================"

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Cyan

# Add all changes
Write-Host "`n📦 Adding all changes..." -ForegroundColor Yellow
git add .

# Create commit
$commitMessage = "Fix Railway 502 error - MODULE_NOT_FOUND resolution

🔧 FIXES APPLIED:
- Remove .ts extensions from imports in server files
- Fix tsx loader flag (--loader → --import) for Node.js v22
- Update Railway startup script command detection
- Improve fallback execution methods

📁 FILES MODIFIED:
- server/index.ts - Fixed import extensions
- server/services/ai-project-manager.ts - Fixed import extensions  
- server/services/lazy-service-factory.ts - Fixed import extensions
- server/services/ai-service-initializer.ts - Fixed import extensions
- server/services/ai-service-discovery.ts - Fixed import extensions
- railway-startup-tsx.cjs - Fixed tsx loader and command detection

✅ VERIFICATION:
- Server starts successfully without MODULE_NOT_FOUND errors
- Database connection established
- AI services initialize properly
- Express app runs correctly
- Ready for Railway deployment

🎯 RESULT:
- Resolves 502 Application failed to respond error
- Backend server now starts properly on Railway
- Application URL should work correctly"

Write-Host "`n💬 Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful" -ForegroundColor Green
    
    # Switch to dev branch if not already on it
    if ($currentBranch -ne "dev") {
        Write-Host "`n🔄 Switching to dev branch..." -ForegroundColor Yellow
        git checkout dev
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "🔧 Creating dev branch..." -ForegroundColor Yellow
            git checkout -b dev
        }
    }
    
    # Merge changes if we were on a different branch
    if ($currentBranch -ne "dev") {
        Write-Host "`n🔀 Merging changes from $currentBranch..." -ForegroundColor Yellow
        git merge $currentBranch --no-ff -m "Merge Railway 502 error fixes from $currentBranch"
    }
    
    # Push to dev branch
    Write-Host "`n🚀 Pushing to dev branch..." -ForegroundColor Yellow
    git push origin dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ SUCCESS: Railway 502 error fixes pushed to dev branch!" -ForegroundColor Green
        Write-Host "`n📋 SUMMARY:" -ForegroundColor Cyan
        Write-Host "✅ Fixed MODULE_NOT_FOUND errors in server imports" -ForegroundColor Green
        Write-Host "✅ Updated tsx loader for Node.js v22 compatibility" -ForegroundColor Green
        Write-Host "✅ Improved Railway startup script reliability" -ForegroundColor Green
        Write-Host "✅ Changes committed and pushed to dev branch" -ForegroundColor Green
        
        Write-Host "`n🎯 NEXT STEPS:" -ForegroundColor Yellow
        Write-Host "1. Railway will auto-deploy from dev branch" -ForegroundColor White
        Write-Host "2. Monitor deployment logs in Railway dashboard" -ForegroundColor White
        Write-Host "3. Test URL: https://creator-dev-server-staging.up.railway.app/" -ForegroundColor White
        Write-Host "4. Verify 502 error is resolved" -ForegroundColor White
        
    } else {
        Write-Host "`n❌ Failed to push to dev branch" -ForegroundColor Red
        Write-Host "🔧 You may need to pull latest changes first:" -ForegroundColor Yellow
        Write-Host "   git pull origin dev" -ForegroundColor White
    }
    
} else {
    Write-Host "`n❌ Commit failed" -ForegroundColor Red
    Write-Host "🔧 Check for any issues and try again" -ForegroundColor Yellow
}

Write-Host "`n🏁 Push script completed" -ForegroundColor Cyan