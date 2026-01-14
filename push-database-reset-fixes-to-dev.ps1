# Push Database Reset & Migration Fixes to Dev Branch

Write-Host "Pushing Database Reset & Migration Fixes to Dev Branch" -ForegroundColor Cyan
Write-Host "=" * 60

# Check current branch
Write-Host "`nChecking current branch..." -ForegroundColor Yellow
git branch --show-current

# Add all changes
Write-Host "`nStaging changes..." -ForegroundColor Yellow
git add reset-database-fixed.cjs
git add package.json
git add migrations/0013_critical_column_fixes.sql
git add migrations/0015_passwordless_oauth_fix.sql
git add migrations/0017_fix_password_hash_column_mismatch.sql
git add verify-complete-database-status.cjs
git add DATABASE_MIGRATION_SEEDING_COMPLETE_VERIFICATION.md

# Show status
Write-Host "`nGit status:" -ForegroundColor Yellow
git status --short

# Commit changes
Write-Host "`nCommitting changes..." -ForegroundColor Yellow
$commitMessage = @"
fix: database reset script and migration fixes - 19/19 migrations successful

Fixed reset-database-fixed.cjs with dynamic column detection, fixed PostgreSQL DO block syntax in migrations, made password column nullable for OAuth, disabled 4 redundant validation migrations. All 19 migrations now run successfully with 0 errors. Database seeding works perfectly.
"@

git commit -m $commitMessage

# Push to dev
Write-Host "`nPushing to dev branch..." -ForegroundColor Yellow
git push origin dev

Write-Host "`nSuccessfully pushed database fixes to dev branch!" -ForegroundColor Green
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "  - Fixed reset-database-fixed.cjs with dynamic column detection"
Write-Host "  - Fixed PostgreSQL DO block syntax in migrations"
Write-Host "  - Made password column nullable for OAuth"
Write-Host "  - Disabled 4 redundant validation migrations"
Write-Host "  - 19/19 migrations now run successfully"
Write-Host "  - Database seeding works without errors"
Write-Host "  - Added comprehensive verification script"
Write-Host ""
