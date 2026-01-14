#!/usr/bin/env pwsh

Write-Host "🚀 EMERGENCY REACT FIX - STARTING NOW" -ForegroundColor Red -BackgroundColor Yellow

# Kill all Node processes
Write-Host "🛑 Stopping all Node processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait for processes to stop
Start-Sleep -Seconds 2

# Clear Vite cache
Write-Host "🧹 Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "✅ Vite cache cleared" -ForegroundColor Green
}

# Clear dist folder
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Dist folder cleared" -ForegroundColor Green
}

Write-Host ""
Write-Host "🔧 REACT IMPORT FIX APPLIED:" -ForegroundColor Green
Write-Host "  ✅ Removed conflicting React global from vite.config.ts" -ForegroundColor Gray
Write-Host "  ✅ Configured automatic JSX runtime" -ForegroundColor Gray
Write-Host "  ✅ Fixed React hook imports" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "⚠️  IMPORTANT: Clear your browser cache after server starts!" -ForegroundColor Yellow
Write-Host "   Press Ctrl+Shift+R to hard refresh your browser" -ForegroundColor Yellow
Write-Host ""

# Start the development server
npm run dev