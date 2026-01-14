#!/usr/bin/env pwsh

Write-Host "🔧 Fixing problematic seed migration" -ForegroundColor Cyan
Write-Host ""

# Rename the problematic migration to skip it
$oldName = "migrations/0002_seed_data_with_conflicts.sql"
$newName = "migrations/0002_seed_data_with_conflicts.sql.skip"

if (Test-Path $oldName) {
    Write-Host "📝 Renaming migration to skip it..." -ForegroundColor Yellow
    Rename-Item -Path $oldName -NewName $newName -Force
    Write-Host "✅ Migration renamed to: $newName" -ForegroundColor Green
    Write-Host "   This migration will be skipped during deployment" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Migration file not found: $oldName" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Fix complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Commit the change: git add -A && git commit -m 'Skip problematic seed migration'" -ForegroundColor White
Write-Host "2. Push to dev: git push origin dev" -ForegroundColor White
Write-Host "3. Deploy: railway up" -ForegroundColor White
