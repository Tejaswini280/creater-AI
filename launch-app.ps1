#!/usr/bin/env pwsh

Write-Host "🚀 Launching CreatorNexus Application..." -ForegroundColor Green
Write-Host ""

# Check if port 5000 is already in use
$portInUse = netstat -ano | findstr :5000
if ($portInUse) {
    Write-Host "⚠️ Port 5000 is already in use!" -ForegroundColor Yellow
    Write-Host "Application may already be running at: http://localhost:5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  1. Visit http://localhost:5000 to use the running app" -ForegroundColor Green
    Write-Host "  2. Stop the existing process and run this script again" -ForegroundColor Yellow
    exit 0
}

# Start the application
Write-Host "📦 Starting development server..." -ForegroundColor Cyan
Write-Host "Environment: Development" -ForegroundColor White
Write-Host "Port: 5000" -ForegroundColor White
Write-Host "Database: PostgreSQL (Local)" -ForegroundColor White
Write-Host ""

# Launch the app
npm run dev