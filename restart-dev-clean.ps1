#!/usr/bin/env pwsh

Write-Host "🔄 Restarting Development Server with React Fix..." -ForegroundColor Cyan

# Kill any existing Node processes on port 5000
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Wait for port to be free
Start-Sleep -Seconds 3

# Clear any cached dependencies
Write-Host "Clearing Vite cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
}

# Start the development server
Write-Host "Starting Vite development server..." -ForegroundColor Green
Write-Host "React import fix has been applied to vite.config.ts" -ForegroundColor Green
Write-Host "- Removed conflicting React global definition" -ForegroundColor Gray
Write-Host "- Configured automatic JSX runtime properly" -ForegroundColor Gray
Write-Host "- Optimized React dependencies" -ForegroundColor Gray

# Start the server
npm run dev