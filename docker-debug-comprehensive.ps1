# Comprehensive Docker Application Debugging Script
Write-Host "=== CreatorNexus Docker Application Debug Report ===" -ForegroundColor Cyan
Write-Host "Generated: $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Function to test endpoint
function Test-Endpoint {
    param($url, $name)
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        Write-Host "✓ $name - Status: $($response.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ $name - Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 1. Docker Status
Write-Host "=== Docker Environment ===" -ForegroundColor Yellow
try {
    Write-Host "Docker Version: $(docker --version)" -ForegroundColor White
    Write-Host "Docker Compose Version: $(docker-compose --version)" -ForegroundColor White
} catch {
    Write-Host "✗ Docker not available" -ForegroundColor Red
}

# 2. Container Status
Write-Host "`n=== Container Status ===" -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.dev.yml ps
} catch {
    Write-Host "✗ Cannot get container status" -ForegroundColor Red
}

# 3. Application Health Checks
Write-Host "`n=== Application Health Checks ===" -ForegroundColor Yellow
$healthOk = Test-Endpoint "http://localhost:5000/api/health" "Health Endpoint"
$frontendOk = Test-Endpoint "http://localhost:5000" "Frontend"
$viteOk = Test-Endpoint "http://localhost:5173" "Vite Dev Server"

# 4. Database Connection Test
Write-Host "`n=== Database Connection ===" -ForegroundColor Yellow
try {
    $dbTest = docker exec creator-ai-postgres-dev pg_isready -U postgres 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ PostgreSQL is ready" -ForegroundColor Green
    } else {
        Write-Host "✗ PostgreSQL is not ready" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Cannot test PostgreSQL connection" -ForegroundColor Red
}

# 5. Redis Connection Test
Write-Host "`n=== Redis Connection ===" -ForegroundColor Yellow
try {
    $redisTest = docker exec creator-ai-redis-dev redis-cli ping 2>$null
    if ($redisTest -eq "PONG") {
        Write-Host "✓ Redis is responding" -ForegroundColor Green
    } else {
        Write-Host "✗ Redis is not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Cannot test Redis connection" -ForegroundColor Red
}

# 6. Port Availability
Write-Host "`n=== Port Status ===" -ForegroundColor Yellow
$ports = @(5000, 5173, 5432, 6379)
foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
        if ($connection) {
            Write-Host "✓ Port $port is accessible" -ForegroundColor Green
        } else {
            Write-Host "✗ Port $port is not accessible" -ForegroundColor Red
        }
    } catch {
        Write-Host "? Port $port status unknown" -ForegroundColor Yellow
    }
}

# 7. Recent Logs
Write-Host "`n=== Recent Application Logs ===" -ForegroundColor Yellow
try {
    Write-Host "Last 10 lines from application:" -ForegroundColor Gray
    docker logs creator-ai-app-dev --tail=10
} catch {
    Write-Host "✗ Cannot get application logs" -ForegroundColor Red
}

Write-Host "`n=== Recent Database Logs ===" -ForegroundColor Yellow
try {
    Write-Host "Last 5 lines from database:" -ForegroundColor Gray
    docker logs creator-ai-postgres-dev --tail=5
} catch {
    Write-Host "✗ Cannot get database logs" -ForegroundColor Red
}

# 8. Resource Usage
Write-Host "`n=== Resource Usage ===" -ForegroundColor Yellow
try {
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
} catch {
    Write-Host "✗ Cannot get resource usage" -ForegroundColor Red
}

# 9. Environment Variables Check
Write-Host "`n=== Environment Check ===" -ForegroundColor Yellow
try {
    $envCheck = docker exec creator-ai-app-dev printenv | Select-String "NODE_ENV|PORT|DATABASE_URL"
    if ($envCheck) {
        Write-Host "Environment variables:" -ForegroundColor Gray
        $envCheck | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
    }
} catch {
    Write-Host "✗ Cannot check environment variables" -ForegroundColor Red
}

# 10. Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
if ($healthOk -and $frontendOk) {
    Write-Host "✓ Application is running successfully!" -ForegroundColor Green
    Write-Host "  • Main App: http://localhost:5000" -ForegroundColor White
    Write-Host "  • Dev Server: http://localhost:5173" -ForegroundColor White
    Write-Host "  • Health Check: http://localhost:5000/api/health" -ForegroundColor White
} else {
    Write-Host "⚠ Application has issues that need attention" -ForegroundColor Yellow
}

Write-Host "`n=== Quick Commands ===" -ForegroundColor Cyan
Write-Host "View live logs: docker-compose -f docker-compose.dev.yml logs -f app-dev" -ForegroundColor White
Write-Host "Restart app: docker-compose -f docker-compose.dev.yml restart app-dev" -ForegroundColor White
Write-Host "Stop all: docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "Rebuild: docker-compose -f docker-compose.dev.yml up --build -d" -ForegroundColor White