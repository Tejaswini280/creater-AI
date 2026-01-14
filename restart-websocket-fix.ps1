# WebSocket Connection Fix and Restart Script
Write-Host "Applying WebSocket Connection Fixes..." -ForegroundColor Cyan

# Stop any running processes
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
try {
    # Kill any existing Node.js processes on port 5000
    $processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processes) {
        foreach ($pid in $processes) {
            Write-Host "Killing process $pid on port 5000" -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    
    # Kill any existing Node.js processes on port 3000 (Vite)
    $processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($processes) {
        foreach ($pid in $processes) {
            Write-Host "Killing process $pid on port 3000" -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
} catch {
    Write-Host "No existing processes to stop" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Apply the WebSocket fixes
Write-Host "Applying WebSocket fixes..." -ForegroundColor Cyan
try {
    node fix-websocket-connection-issue.cjs
    if ($LASTEXITCODE -eq 0) {
        Write-Host "WebSocket fixes applied successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to apply WebSocket fixes" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error applying WebSocket fixes: $_" -ForegroundColor Red
    exit 1
}

# Start the development server
Write-Host "Starting development server..." -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "  WebSocket: ws://localhost:5000/ws" -ForegroundColor White
Write-Host ""
Write-Host "WebSocket connection should now work properly!" -ForegroundColor Green
Write-Host "The fixes include:" -ForegroundColor Yellow
Write-Host "  - Fixed WebSocket URL construction (no more undefined port)" -ForegroundColor White
Write-Host "  - Proper authentication handling" -ForegroundColor White
Write-Host "  - Relative URLs for development (Vite proxy)" -ForegroundColor White
Write-Host "  - Better error handling and validation" -ForegroundColor White
Write-Host ""

# Start the server
npm run dev