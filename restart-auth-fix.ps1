#!/usr/bin/env pwsh

Write-Host "🔧 AUTH FIX - Restarting Application..." -ForegroundColor Cyan
Write-Host ""

# Stop any running processes
Write-Host "🛑 Stopping existing processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} catch {
    Write-Host "⚠️ No processes to stop" -ForegroundColor Yellow
}

# Clear npm cache
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>$null

# Clear node_modules/.cache if it exists
if (Test-Path "node_modules/.cache") {
    Write-Host "🧹 Clearing node_modules cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
}

# Clear dist folder
if (Test-Path "dist") {
    Write-Host "🧹 Clearing dist folder..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✅ Cache cleared successfully!" -ForegroundColor Green
Write-Host ""

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔑 Test credentials: admin@test.com / password123" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Auth Fix Applied:" -ForegroundColor Yellow
Write-Host "  ✅ Fixed redirect loops" -ForegroundColor Green
Write-Host "  ✅ Improved auth state management" -ForegroundColor Green
Write-Host "  ✅ Better loading states" -ForegroundColor Green
Write-Host "  ✅ Proper navigation handling" -ForegroundColor Green
Write-Host ""

# Start the development server
npm run dev