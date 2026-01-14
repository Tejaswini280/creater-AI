# Docker Application Access Information

Write-Host "🐳 Docker Application Status" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

# Check container status
Write-Host "`n📋 Container Status:" -ForegroundColor Yellow
docker-compose ps

# Get container IPs
Write-Host "`n🔧 Container Information:" -ForegroundColor Yellow
$appIP = docker inspect creator-ai-app --format="{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"
$dbIP = docker inspect creator-ai-postgres --format="{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"
$redisIP = docker inspect creator-ai-redis --format="{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"

Write-Host "App Container IP: $appIP" -ForegroundColor White
Write-Host "Database Container IP: $dbIP" -ForegroundColor White  
Write-Host "Redis Container IP: $redisIP" -ForegroundColor White

# Access methods
Write-Host "`n🌐 How to Access Your Application:" -ForegroundColor Yellow
Write-Host "1. Via localhost: http://localhost:5000" -ForegroundColor Cyan
Write-Host "2. Via container IP: http://$appIP`:5000" -ForegroundColor Cyan

# Get machine IP for external access
$machineIP = (Get-NetIPConfiguration | Where-Object {$_.IPv4Address.IPAddress -like "10.*" -or $_.IPv4Address.IPAddress -like "192.168.*"}).IPv4Address.IPAddress | Select-Object -First 1

if ($machineIP) {
    Write-Host "3. From other devices: http://$machineIP`:5000" -ForegroundColor Cyan
}

Write-Host "`n🧪 Testing Connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ SUCCESS: Application is accessible!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor White
} catch {
    Write-Host "❌ Connection failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🛠️ Useful Commands:" -ForegroundColor Yellow
Write-Host "View logs: docker logs creator-ai-app -f" -ForegroundColor White
Write-Host "Restart: docker restart creator-ai-app" -ForegroundColor White
Write-Host "Stop all: docker-compose down" -ForegroundColor White