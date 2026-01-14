# Restart Docker Application with Proper Configuration

Write-Host "🔧 Restarting Docker Application..." -ForegroundColor Green

# Stop current containers
Write-Host "1. Stopping containers..." -ForegroundColor Yellow
docker-compose down

# Clean up
Write-Host "2. Cleaning up..." -ForegroundColor Yellow
docker container prune -f

# Start with new configuration
Write-Host "3. Starting containers with new config..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for startup
Write-Host "4. Waiting for startup..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check status
Write-Host "5. Checking status..." -ForegroundColor Yellow
docker-compose ps

# Test connection
Write-Host "6. Testing connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 10
    Write-Host "✅ SUCCESS: Application accessible at http://localhost:5000" -ForegroundColor Green
} catch {
    Write-Host "❌ Connection failed. Checking logs..." -ForegroundColor Red
    docker logs creator-ai-app --tail 10
}

Write-Host "`n🌐 Try accessing: http://localhost:5000" -ForegroundColor Cyan