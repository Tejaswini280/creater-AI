# Test Docker Application Connection

Write-Host "🧪 Testing Docker Application Connection..." -ForegroundColor Green

# Check container status
Write-Host "`n📋 Container Status:" -ForegroundColor Yellow
docker-compose ps

# Check if port is accessible
Write-Host "`n🔌 Testing port accessibility..." -ForegroundColor Yellow
$portTest = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet
if ($portTest) {
    Write-Host "✅ Port 5000 is accessible" -ForegroundColor Green
} else {
    Write-Host "❌ Port 5000 is not accessible" -ForegroundColor Red
}

# Test with different methods
Write-Host "`n🌐 Testing HTTP connection..." -ForegroundColor Yellow

# Method 1: PowerShell Invoke-WebRequest
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 5 -MaximumRedirection 0
    Write-Host "✅ Method 1 Success: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Method 1 Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 2: Test with curl (if available)
try {
    $curlResult = curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 2>$null
    Write-Host "✅ Method 2 (curl): Status $curlResult" -ForegroundColor Green
} catch {
    Write-Host "❌ Method 2 (curl) not available" -ForegroundColor Yellow
}

# Method 3: Test from inside container
Write-Host "`n🐳 Testing from inside container..." -ForegroundColor Yellow
$containerTest = docker exec creator-ai-app node -e "require('http').get('http://localhost:5000', (res) => { console.log('Status:', res.statusCode); }).on('error', err => console.log('Error:', err.message));" 2>$null
Write-Host "Container test result: $containerTest" -ForegroundColor White

# Check application logs
Write-Host "`n📋 Recent application logs:" -ForegroundColor Yellow
docker logs creator-ai-app --tail 10

Write-Host "`n💡 Recommendations:" -ForegroundColor Yellow
Write-Host "1. Try opening http://localhost:5000 in your browser" -ForegroundColor White
Write-Host "2. Check Windows Firewall settings" -ForegroundColor White
Write-Host "3. Try restarting Docker Desktop" -ForegroundColor White
Write-Host "4. Check if another application is using port 5000" -ForegroundColor White