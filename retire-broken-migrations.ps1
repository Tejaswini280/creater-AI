# Retire Broken Migrations - Phase 2 of Permanent Solution

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "PHASE 2: RETIRING BROKEN MIGRATIONS" -ForegroundColor Cyan
Write-Host "=============================================================" -ForegroundColor Cyan

Write-Host "`nThis script will rename 21 never-executed migrations to .retired" -ForegroundColor Yellow
Write-Host "These migrations will never execute correctly because:" -ForegroundColor Yellow
Write-Host "  - They expect schema state that doesn't exist" -ForegroundColor White
Write-Host "  - They conflict with actual schema (password vs password_hash)" -ForegroundColor White
Write-Host "  - They have unmet dependencies" -ForegroundColor White

Write-Host "`nMigrations to retire:" -ForegroundColor Yellow

$migrationsToRetire = @(
    "0001_core_tables_idempotent.sql",
    "0008_final_constraints_and_cleanup.sql",
    "0009_railway_production_repair_complete.sql",
    "0010_railway_production_schema_repair_final.sql",
    "0011_add_missing_unique_constraints.sql",
    "0012_immediate_dependency_fix.sql",
    "0013_critical_column_fixes.sql",
    "0014_comprehensive_column_additions.sql",
    "0015_passwordless_oauth_fix.sql",
    "0017_fix_password_hash_column_mismatch.sql",
    "0018_fix_password_hash_null_constraint.sql",
    "0019_fix_password_hash_null_values_hotfix.sql",
    "0020_fix_password_hash_null_values_production.sql",
    "0021_fix_password_null_constraint_permanent.sql",
    "0022_fix_password_nullable_for_oauth.sql",
    "0023_fix_password_nullable_permanent.sql",
    "0024_fix_password_not_null_constraint_permanent.sql",
    "0025_consolidated_permanent_fix.sql",
    "0026_add_missing_description_column.sql",
    "0027_add_missing_script_column.sql",
    "0028_fix_schema_migrations_table_structure.sql"
)

foreach ($migration in $migrationsToRetire) {
    Write-Host "  - $migration" -ForegroundColor White
}

Write-Host "`nTotal: $($migrationsToRetire.Count) migrations" -ForegroundColor Yellow

Write-Host "`nStarting retirement process..." -ForegroundColor Green

$retiredCount = 0
$notFoundCount = 0
$errorCount = 0

foreach ($migration in $migrationsToRetire) {
    $sourcePath = "migrations/$migration"
    $targetPath = "migrations/$migration.retired"
    
    if (Test-Path $sourcePath) {
        try {
            Rename-Item -Path $sourcePath -NewName "$migration.retired" -ErrorAction Stop
            Write-Host "  Retired: $migration" -ForegroundColor Green
            $retiredCount++
        }
        catch {
            Write-Host "  ERROR retiring $migration : $_" -ForegroundColor Red
            $errorCount++
        }
    }
    else {
        Write-Host "  NOT FOUND: $migration (may already be retired)" -ForegroundColor Yellow
        $notFoundCount++
    }
}

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host "RETIREMENT COMPLETE" -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Cyan

Write-Host "`nResults:" -ForegroundColor Yellow
Write-Host "  Retired: $retiredCount migrations" -ForegroundColor Green
Write-Host "  Not found: $notFoundCount migrations" -ForegroundColor Yellow
Write-Host "  Errors: $errorCount migrations" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })

if ($retiredCount -gt 0) {
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Review retired migrations in migrations/ folder" -ForegroundColor White
    Write-Host "  2. Commit changes to git" -ForegroundColor White
    Write-Host "  3. Push to dev branch" -ForegroundColor White
    Write-Host "  4. Proceed to Phase 3: Harden migration runner" -ForegroundColor White
}

Write-Host "`n=============================================================" -ForegroundColor Cyan
