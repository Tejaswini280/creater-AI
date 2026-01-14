#!/usr/bin/env pwsh

# ═══════════════════════════════════════════════════════════════════════════════
# SIMPLE APPLICATION RUNNER
# ═══════════════════════════════════════════════════════════════════════════════
# This script runs the application with minimal setup for quick testing
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 STARTING APPLICATION (SIMPLE MODE)..." -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: Install dependencies
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Build client
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ Building client..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Client build failed!" -ForegroundColor Red
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Start application
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 APPLICATION STARTING!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "⚠️  Note: Database features may not work without PostgreSQL setup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Gray
Write-Host ""

# Start the development server
npm run dev