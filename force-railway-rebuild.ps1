# Force Railway Complete Rebuild

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FORCE RAILWAY REBUILD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will force Railway to do a complete rebuild" -ForegroundColor Yellow
Write-Host "Use this if Railway is still showing the old error" -ForegroundColor Yellow
Write-Host ""

# Make a meaningful change to force rebuild
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

Write-Host "Creating rebuild trigger..." -ForegroundColor Cyan

# Update a comment in package.json to force rebuild
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson | Add-Member -NotePropertyName "_rebuild" -NotePropertyValue $timestamp -Force
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

Write-Host "Committing rebuild trigger..." -ForegroundColor Cyan
git add package.json
git commit -m "chore: force Railway rebuild - $timestamp"

Write-Host "Pushing to trigger complete rebuild..." -ForegroundColor Cyan
git push origin dev

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "REBUILD TRIGGERED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Railway will now:" -ForegroundColor Cyan
Write-Host "  1. Detect the package.json change" -ForegroundColor White
Write-Host "  2. Clear all caches" -ForegroundColor White
Write-Host "  3. Do a complete fresh build" -ForegroundColor White
Write-Host "  4. Run migrations with fixed code" -ForegroundColor White
Write-Host "  5. Start the application" -ForegroundColor White
Write-Host ""
Write-Host "This should take 5-10 minutes" -ForegroundColor Yellow
Write-Host "Monitor progress in Railway dashboard" -ForegroundColor Yellow
