# Docker Debugging Script
Write-Host "Docker Debugging Information" -ForegroundColor Cyan

Write-Host "`n=== Docker Status ===" -ForegroundColor Yellow
try {
    docker --version
    docker-compose --version
} catch {
    Write-Host "Docker not available" -ForegroundColor Red
}

Write-Host "`n=== Running Containers ===" -ForegroundColor Yellow
try {
    docker ps
} catch {
    Write-Host "Cannot connect to Docker daemon" -ForegroundColor Red
}

Write-Host "`n=== Docker Compose Services ===" -ForegroundColor Yellow
try {
    docker-compose ps
} catch {
    Write-Host "Docker Compose not available or no services running" -ForegroundColor Red
}

Write-Host "`n=== Application Logs (Last 20 lines) ===" -ForegroundColor Yellow
try {
    docker-compose logs --tail=20 app
} catch {
    Write-Host "Cannot get application logs" -ForegroundColor Red
}

Write-Host "`n=== Database Logs (Last 10 lines) ===" -ForegroundColor Yellow
try {
    docker-compose logs --tail=10 postgres
} catch {
    Write-Host "Cannot get database logs" -ForegroundColor Red
}

Write-Host "`n=== Port Check ===" -ForegroundColor Yellow
try {
    $response = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet
    if ($response) {
        Write-Host "✓ Port 5000 is accessible" -ForegroundColor Green
    } else {
        Write-Host "✗ Port 5000 is not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "Cannot test port connectivity" -ForegroundColor Red
}

Write-Host "`n=== Health Check ===" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5
    Write-Host "✓ Health check passed: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Disk Space ===" -ForegroundColor Yellow
try {
    docker system df
} catch {
    Write-Host "Cannot get Docker disk usage" -ForegroundColor Red
}

Write-Host "`nDebugging complete!" -ForegroundColor Cyan