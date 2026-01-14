# Deploy Railway Templates Schema Fix
# Fixes the column name mismatch in migration 0004_seed_essential_data.sql

Write-Host "🚀 Deploying Railway Templates Schema Fix" -ForegroundColor Cyan
Write-Host "=" * 60

# Verify the fix is in place
Write-Host "`n✅ Verifying fix..." -ForegroundColor Yellow
node fix-railway-templates-schema-mismatch.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Fix verification failed!" -ForegroundColor Red
    exit 1
}

# Show what changed
Write-Host "`n📝 Changes to be deployed:" -ForegroundColor Yellow
git diff migrations/0004_seed_essential_data.sql

# Commit the fix
Write-Host "`n💾 Committing fix..." -ForegroundColor Yellow
git add migrations/0004_seed_essential_data.sql
git add fix-railway-templates-schema-mismatch.cjs
git commit -m "fix: correct templates table column names in seed migration

Root Cause:
- Migration 0004 was using 'name' column but templates table has 'title'
- Migration 0004 was using 'template_data' but table has 'metadata'
- Migration 0004 was missing required 'type' column

Fix:
- Changed INSERT to use correct column names (title, metadata, type)
- Changed to conditional INSERT to avoid conflict issues
- Added verification script

This fixes the Railway deployment error:
'Migration WMAA_seed_essential_data.sql failed: column name of relation templates does not exist'"

# Push to trigger deployment
Write-Host "`n🚀 Pushing to Railway..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Fix deployed! Monitor Railway logs for successful migration." -ForegroundColor Green
Write-Host "`n📊 Expected outcome:" -ForegroundColor Cyan
Write-Host "  ✅ Migration 0004 completes successfully"
Write-Host "  ✅ Templates table populated with seed data"
Write-Host "  ✅ Application starts without errors"
Write-Host ""
