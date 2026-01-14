# Fresh Start Script - Complete Application Restart

Write-Host "Starting fresh application restart..." -ForegroundColor Green

# Kill any existing processes
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start the development server
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "Application will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Start the server
npm run dev