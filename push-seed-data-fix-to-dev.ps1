# Push Seed Data Migration Fix to Dev Branch

Write-Host "Pushing Seed Data Migration Fix to Dev Branch..." -ForegroundColor Cyan
Write-Host ""

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Add the fixed files
Write-Host ""
Write-Host "Adding fixed files..." -ForegroundColor Cyan
git add migrations/0004_seed_essential_data.sql
git add verify-seed-data-fix.cjs
git add test-seed-data-migration.cjs
git add SEED_DATA_MIGRATION_FIX_COMPLETE.md
git add ROOT_CAUSE_ANALYSIS_SEED_DATA_FIX.md
git add PERMANENT_FIX_SUMMARY.md
git add push-seed-data-fix-to-dev.ps1

# Commit the changes
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "fix: correct hashtag_suggestions column names in seed data migration" -m "Fixed popularity_score to trend_score + usage_count" -m "Aligned with actual schema" -m "Added verification scripts"

# Push to dev
Write-Host ""
Write-Host "Pushing to dev branch..." -ForegroundColor Cyan

if ($currentBranch -eq "dev") {
    git push origin dev
    Write-Host ""
    Write-Host "Successfully pushed to dev branch!" -ForegroundColor Green
} else {
    Write-Host "Not on dev branch. Switching to dev..." -ForegroundColor Yellow
    git checkout dev
    git merge $currentBranch --no-ff -m "Merge seed data migration fix from $currentBranch"
    git push origin dev
    Write-Host ""
    Write-Host "Successfully merged and pushed to dev branch!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test locally: npm run start:dev" -ForegroundColor White
Write-Host "   2. Verify: node verify-seed-data-fix.cjs" -ForegroundColor White
Write-Host "   3. Deploy to Railway: .\deploy-railway-simple.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Seed data migration fix is ready for deployment!" -ForegroundColor Green
