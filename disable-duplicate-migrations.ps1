# ═══════════════════════════════════════════════════════════════════════════════
# DISABLE DUPLICATE MIGRATIONS
# ═══════════════════════════════════════════════════════════════════════════════
# This script disables duplicate password-related migrations that are now
# consolidated into migration 0025.
#
# WHAT IT DOES:
# 1. Renames migrations 0015, 0017-0024 to .disabled
# 2. Keeps them for reference but prevents execution
# 3. Creates a backup of the migrations folder
# 4. Logs all changes
#
# Date: 2026-01-14
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DISABLE DUPLICATE MIGRATIONS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create backup
Write-Host "📦 Step 1: Creating backup..." -ForegroundColor Yellow
$backupDir = "migrations_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item -Path "migrations" -Destination $backupDir -Recurse
Write-Host "✅ Backup created: $backupDir" -ForegroundColor Green
Write-Host ""

# Step 2: List migrations to disable
Write-Host "📋 Step 2: Migrations to disable:" -ForegroundColor Yellow
$migrationsToDisable = @(
    "migrations/0015_passwordless_oauth_fix.sql",
    "migrations/0017_fix_password_hash_column_mismatch.sql",
    "migrations/0018_fix_password_hash_null_constraint.sql",
    "migrations/0019_fix_password_hash_null_values_hotfix.sql",
    "migrations/0020_fix_password_hash_null_values_production.sql",
    "migrations/0021_fix_password_null_constraint_permanent.sql",
    "migrations/0022_fix_password_nullable_for_oauth.sql",
    "migrations/0023_fix_password_nullable_permanent.sql",
    "migrations/0024_fix_password_not_null_constraint_permanent.sql"
)

foreach ($migration in $migrationsToDisable) {
    if (Test-Path $migration) {
        Write-Host "  - $migration" -ForegroundColor White
    }
}
Write-Host ""

# Step 3: Disable migrations
Write-Host "🔒 Step 3: Disabling migrations..." -ForegroundColor Yellow
$disabledCount = 0
foreach ($migration in $migrationsToDisable) {
    if (Test-Path $migration) {
        $newName = "$migration.disabled"
        Rename-Item -Path $migration -NewName $newName -Force
        Write-Host "  ✅ Disabled: $(Split-Path $migration -Leaf)" -ForegroundColor Green
        $disabledCount++
    } else {
        Write-Host "  ⚠️  Not found: $(Split-Path $migration -Leaf)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 4: Verify new migration exists
Write-Host "🔍 Step 4: Verifying consolidated migration..." -ForegroundColor Yellow
if (Test-Path "migrations/0025_consolidated_permanent_fix.sql") {
    Write-Host "  ✅ Migration 0025 exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ Migration 0025 NOT FOUND!" -ForegroundColor Red
    Write-Host "  Please create migrations/0025_consolidated_permanent_fix.sql first" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Summary
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Backup created: $backupDir" -ForegroundColor Green
Write-Host "✅ Migrations disabled: $disabledCount" -ForegroundColor Green
Write-Host "✅ Consolidated migration: 0025_consolidated_permanent_fix.sql" -ForegroundColor Green
Write-Host ""
Write-Host "📝 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Test migration 0025 on local database" -ForegroundColor White
Write-Host "2. Test migration 0025 on Railway staging" -ForegroundColor White
Write-Host "3. Deploy to Railway production" -ForegroundColor White
Write-Host "4. Monitor for 502 errors" -ForegroundColor White
Write-Host "5. Verify OAuth users can register" -ForegroundColor White
Write-Host ""
Write-Host "🔄 TO RESTORE:" -ForegroundColor Yellow
Write-Host "Copy files from $backupDir back to migrations/" -ForegroundColor White
Write-Host ""
Write-Host "✅ DONE!" -ForegroundColor Green
