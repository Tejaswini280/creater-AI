# Access Docker Application Script
# This script shows you how to access your Docker-based application

Write-Host "🐳 Docker Application Access Information" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Get container information
Write-Host "📋 Container Status:" -ForegroundColor Yellow
docker-compose ps

Write-Host "`n🌐 Access URLs:" -ForegroundColor Yellow

# Method 1: Via localhost (port mapping)
Write-Host "1. Via localhost (recommended):" -ForegroundColor Cyan
Write-Host "   http://localhost:5000" -ForegroundColor White
Write-Host "   http://127.0.0.1:5000" -ForegroundColor White

# Method 2: Via your machine's IP
$machineIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" | Where-Object {$_.IPAddress -like "10.*" -or $_.IPAddress -like "192.168.*"}).IPAddress
if ($machineIP) {
    Write-Host "2. Via your machine's IP (accessible from other devices):" -ForegroundColor Cyan
    Write-Host "   http://${machineIP}:5000" -ForegroundColor White
}

# Method 3: Via Docker container IP (internal)
$containerIP = docker inspect creator-ai-app --format="{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"
if ($containerIP) {
    Write-Host "3. Via Docker container IP (internal):" -ForegroundColor Cyan
    Write-Host "   http://${containerIP}:5000" -ForegroundColor White
}

Write-Host "`n🔧 Container IPs:" -ForegroundColor Yellow
Write-Host "App Container: $containerIP" -ForegroundColor White
$postgresIP = docker inspect creator-ai-postgres --format="{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"
Write-Host "Database Container: $postgresIP" -ForegroundColor White
$redisIP = docker inspect creator-ai-redis --format="{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}"
Write-Host "Redis Container: $redisIP" -ForegroundColor White

Write-Host "`n🧪 Testing connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is accessible at http://localhost:5000" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Application responded with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Could not connect to http://localhost:5000" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host "`n🔍 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if containers are running: docker-compose ps" -ForegroundColor White
    Write-Host "2. Check application logs: docker logs creator-ai-app" -ForegroundColor White
    Write-Host "3. Restart containers: docker-compose restart" -ForegroundColor White
}

Write-Host "`n📱 Mobile/Other Device Access:" -ForegroundColor Yellow
if ($machineIP) {
    Write-Host "To access from your phone or other devices on the same network:" -ForegroundColor White
    Write-Host "http://${machineIP}:5000" -ForegroundColor Cyan
} else {
    Write-Host "Run 'ipconfig' to find your machine's IP address" -ForegroundColor White
}

Write-Host "`n🛠️ Useful Commands:" -ForegroundColor Yellow
Write-Host "View logs: docker logs creator-ai-app -f" -ForegroundColor White
Write-Host "Restart app: docker restart creator-ai-app" -ForegroundColor White
Write-Host "Stop all: docker-compose down" -ForegroundColor White
Write-Host "Start all: docker-compose up -d" -ForegroundColor White