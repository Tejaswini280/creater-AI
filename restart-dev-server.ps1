# Kill any existing processes on ports 5000 and 5001
Write-Host "🔄 Stopping existing servers..." -ForegroundColor Yellow

# Kill processes on port 5000
$processes5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($processes5000) {
    foreach ($pid in $processes5000) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $pid on port 5000" -ForegroundColor Green
        } catch {}
    }
}

# Kill processes on port 5001
$processes5001 = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($processes5001) {
    foreach ($pid in $processes5001) {
        try {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $pid on port 5001" -ForegroundColor Green
        } catch {}
    }
}

# Wait a moment
Start-Sleep -Seconds 2

Write-Host "🚀 Starting development server..." -ForegroundColor Green

# Start the development server
npm run dev