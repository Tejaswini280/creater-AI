# Fast Docker Setup
Write-Host "Fast Docker Setup Starting..." -ForegroundColor Green

# Stop existing containers
docker-compose down -v 2>$null

# Build and start
Write-Host "Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait 30 seconds
Write-Host "Waiting 30 seconds for startup..." -ForegroundColor Yellow
Start-Sleep 30

# Test
Write-Host "Testing application..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5
    Write-Host "✓ App running at http://localhost:5000" -ForegroundColor Green
} catch {
    Write-Host "✗ App not responding, check logs: docker-compose logs app" -ForegroundColor Red
}

Write-Host "Done! App: http://localhost:5000" -ForegroundColor Cyan