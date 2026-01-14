#!/usr/bin/env pwsh
# Quick script to commit and push password_hash fix to dev branch

Write-Host "🔧 Committing password_hash permanent fix..." -ForegroundColor Cyan

# Add all fix files
git add migrations/0007_production_repair_idempotent.sql
git add migrations/0011_add_missing_unique_constraints.sql
git add fix-password-hash-permanent.sql
git add deploy-railway-password-hash-fix.ps1
git add push-password-hash-fix-to-dev.ps1
git add PASSWORD_HASH_ROOT_CAUSE_PERMANENT_FIX.md
git add verify-password-hash-fix.cjs

# Commit with proper message
git commit -m "fix: permanent solution for password_hash NOT NULL constraint" -m "Fixed migration 0007 to include password_hash in user inserts" -m "Fixed migration 0011 to include password_hash in test user" -m "Added fix-password-hash-permanent.sql for existing databases" -m "Column name: password_hash (not password)" -m "Default value: oauth_user_no_password for OAuth users" -m "Resolves Railway 502 errors from NULL password_hash" -m "" -m "Root cause: Users table requires password_hash column but inserts" -m "were missing it, causing NOT NULL constraint violations." -m "" -m "This is the PERMANENT fix that prevents the issue at the source."

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green
    
    # Push to dev
    Write-Host "📤 Pushing to dev branch..." -ForegroundColor Cyan
    git push origin dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully pushed to dev branch" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Railway will auto-deploy from dev branch" -ForegroundColor White
        Write-Host "   2. Monitor deployment logs for migration success" -ForegroundColor White
        Write-Host "   3. Run: node verify-password-hash-fix.cjs" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Failed to push to dev" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Nothing to commit (changes may already be committed)" -ForegroundColor Yellow
}
