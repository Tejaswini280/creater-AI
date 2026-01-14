#!/usr/bin/env pwsh

Write-Host "🚀 Pushing Railway Deployment Fixes to Dev Branch..." -ForegroundColor Green

# Check current status
Write-Host "Current status:" -ForegroundColor Cyan
git status --short

# Show what we're about to push
Write-Host "Files to push include:" -ForegroundColor Cyan
Write-Host "  ✅ railway-startup-simple.cjs (simple startup script)" -ForegroundColor White
Write-Host "  ✅ package.json (fixed duplicate keys)" -ForegroundColor White
Write-Host "  ✅ railway.json (updated start command)" -ForegroundColor White
Write-Host "  ✅ fix-railway-deployment-final.cjs (automated fix)" -ForegroundColor White
Write-Host "  ✅ RAILWAY_DEPLOYMENT_FINAL_FIX_COMPLETE.md (documentation)" -ForegroundColor White

# Try different remotes in order of preference
$remotes = @("origin", "target", "new-repo")

foreach ($remote in $remotes) {
    Write-Host "Trying to push to remote: $remote" -ForegroundColor Yellow
    
    try {
        git push $remote dev
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SUCCESS! Railway fixes pushed to $remote/dev!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🎉 Railway Deployment Fixes Applied:" -ForegroundColor Yellow
            Write-Host "   ✅ Fixed 'Cannot find module' error" -ForegroundColor White
            Write-Host "   ✅ Removed duplicate package.json keys" -ForegroundColor White
            Write-Host "   ✅ Created simple, dependency-free startup script" -ForegroundColor White
            Write-Host "   ✅ Updated Railway configuration" -ForegroundColor White
            Write-Host ""
            Write-Host "🚀 Railway should now deploy successfully!" -ForegroundColor Green
            exit 0
        }
    } catch {
        Write-Host "Failed to push to $remote" -ForegroundColor Red
        continue
    }
}

Write-Host "❌ All push attempts failed. Please check repository permissions." -ForegroundColor Red
Write-Host "💡 You may need to:" -ForegroundColor Yellow
Write-Host "   1. Check GitHub authentication" -ForegroundColor White
Write-Host "   2. Verify repository access permissions" -ForegroundColor White
Write-Host "   3. Ensure the dev branch exists on the remote" -ForegroundColor White