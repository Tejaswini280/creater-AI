#!/usr/bin/env pwsh

Write-Host "🚀 PUSHING RAILWAY 502 ERROR FIX TO DEV BRANCH" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Add all the fixed files
Write-Host "📁 Adding fixed files..." -ForegroundColor Yellow
git add .github/workflows/staging-deploy.yml
git add .github/workflows/production-deploy.yml
git add railway.json
git add RAILWAY_502_ERROR_PERMANENT_SOLUTION_COMPLETE.md
git add deploy-railway-authenticated.cjs
git add deploy-railway-final-fix.cjs
git add fix-railway-deployment-permanent-solution.cjs

# Commit the changes
Write-Host "💾 Committing Railway 502 error fix..." -ForegroundColor Yellow
git commit -m "🔧 PERMANENT FIX: Railway 502 error - Updated CLI syntax

- Fixed GitHub Actions workflows to use correct Railway CLI syntax
- Changed from -p/-s flags to --project/--service flags
- Updated both staging and production deployment workflows
- Added comprehensive documentation and manual deployment scripts
- Root cause: Railway CLI syntax change broke deployments
- Solution: Use railway link --project PROJECT_ID --service SERVICE_ID

Fixes Railway deployment 502 errors permanently."

# Push to dev branch
Write-Host "🚀 Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

Write-Host ""
Write-Host "✅ RAILWAY 502 ERROR FIX PUSHED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 WHAT HAPPENS NEXT:" -ForegroundColor Cyan
Write-Host "1. GitHub Actions will trigger on the next push to dev" -ForegroundColor White
Write-Host "2. The fixed workflow will use correct Railway CLI syntax" -ForegroundColor White
Write-Host "3. Deployment should succeed without 502 errors" -ForegroundColor White
Write-Host ""
Write-Host "🔍 MONITOR DEPLOYMENT:" -ForegroundColor Cyan
Write-Host "- GitHub Actions: https://github.com/your-repo/actions" -ForegroundColor White
Write-Host "- Railway Dashboard: https://railway.app/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "🎯 YOUR RAILWAY SERVICES:" -ForegroundColor Cyan
Write-Host "- Project ID: 711091cc-10bf-41a3-87cf-8d058419de4f" -ForegroundColor White
Write-Host "- Staging Service: 01abc727-2496-4948-95e7-c05f629936e8" -ForegroundColor White
Write-Host "- Production Service: db7499d8-fa40-476e-a943-9d62370bf3a8" -ForegroundColor White