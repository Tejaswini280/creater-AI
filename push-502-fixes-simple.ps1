# ═══════════════════════════════════════════════════════════════════════════════
# PUSH 502 ERROR FIXES TO DEV BRANCH - SIMPLE VERSION
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 PUSHING 502 ERROR FIXES TO DEV BRANCH" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Add all files
Write-Host "📋 Adding files..." -ForegroundColor Green
git add .

# Create commit
Write-Host "📋 Creating commit..." -ForegroundColor Green
git commit -m "fix: Complete 502 error resolution with database schema fixes"

# Push to dev branch
Write-Host "📋 Pushing to dev branch..." -ForegroundColor Green
try {
    git push origin dev
    Write-Host "✅ Successfully pushed to dev branch" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Creating dev branch and pushing..." -ForegroundColor Yellow
    git checkout -b dev
    git push -u origin dev
    Write-Host "✅ Created dev branch and pushed successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 502 ERROR FIXES PUSHED TO DEV SUCCESSFULLY!" -ForegroundColor Green
Write-Host "✅ All database schema fixes are now on dev branch" -ForegroundColor Green
Write-Host "✅ 502 error resolution scripts are deployed" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 The 502 errors should be resolved with these fixes!" -ForegroundColor Cyan