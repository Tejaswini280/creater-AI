#!/usr/bin/env pwsh
# Simple Cache Clear and Restart Script

Write-Host "🧹 Starting cache clearing process..." -ForegroundColor Green

# Stop running processes
Write-Host "🛑 Stopping running processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear npm cache
Write-Host "🗑️ Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Clear build directories
Write-Host "🗑️ Clearing build directories..." -ForegroundColor Yellow
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue }
if (Test-Path "build") { Remove-Item -Recurse -Force "build" -ErrorAction SilentlyContinue }
if (Test-Path "client/dist") { Remove-Item -Recurse -Force "client/dist" -ErrorAction SilentlyContinue }
if (Test-Path "server/dist") { Remove-Item -Recurse -Force "server/dist" -ErrorAction SilentlyContinue }
if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue }
if (Test-Path "node_modules/.vite") { Remove-Item -Recurse -Force "node_modules/.vite" -ErrorAction SilentlyContinue }

# Clear TypeScript cache
if (Test-Path ".tsbuildinfo") { Remove-Item -Force ".tsbuildinfo" -ErrorAction SilentlyContinue }

# Clear temp files
Write-Host "🗑️ Clearing temporary files..." -ForegroundColor Yellow
Get-ChildItem -Path . -Name "temp-*" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path . -Name "*.tmp" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Clear uploads and logs (keep directories)
if (Test-Path "uploads") {
    Get-ChildItem "uploads" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "logs") {
    Get-ChildItem "logs" -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "✅ Cache clearing completed!" -ForegroundColor Green
Write-Host "📋 Manual steps needed:" -ForegroundColor Cyan
Write-Host "   1. Close all browser windows" -ForegroundColor White
Write-Host "   2. Press Ctrl+Shift+Delete to clear browser data" -ForegroundColor White
Write-Host "   3. Open clear-browser-cache.html to clear web storage" -ForegroundColor White
Write-Host "   4. Restart your browser" -ForegroundColor White
Write-Host "   5. Run 'npm run dev' to start fresh" -ForegroundColor White

Write-Host "🌟 Ready for fresh start!" -ForegroundColor Green