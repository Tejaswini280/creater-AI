# Simple Docker Application Debug Script
Write-Host "=== CreatorNexus Docker Debug Report ===" -ForegroundColor Cyan
Write-Host ""

# 1. Container Status
Write-Host "=== Container Status ===" -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml ps

# 2. Health Check
Write-Host "`n=== Health Check ===" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Health Check: Status $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Frontend Check
Write-Host "`n=== Frontend Check ===" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Frontend: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Database Check
Write-Host "`n=== Database Check ===" -ForegroundColor Yellow
try {
    docker exec creator-ai-postgres-dev pg_isready -U postgres
    Write-Host "✓ PostgreSQL is ready" -ForegroundColor Green
} catch {
    Write-Host "✗ PostgreSQL check failed" -ForegroundColor Red
}

# 5. Redis Check
Write-Host "`n=== Redis Check ===" -ForegroundColor Yellow
try {
    $redisResult = docker exec creator-ai-redis-dev redis-cli ping
    if ($redisResult -match "PONG") {
        Write-Host "✓ Redis is responding" -ForegroundColor Green
    } else {
        Write-Host "✗ Redis not responding" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Redis check failed" -ForegroundColor Red
}

# 6. Recent Logs
Write-Host "`n=== Recent Application Logs ===" -ForegroundColor Yellow
docker logs creator-ai-app-dev --tail=10

Write-Host "`n=== Access URLs ===" -ForegroundColor Cyan
Write-Host "Main Application: http://localhost:5000" -ForegroundColor White
Write-Host "Vite Dev Server: http://localhost:5173" -ForegroundColor White
Write-Host "Health Check: http://localhost:5000/api/health" -ForegroundColor White

Write-Host "`n=== Quick Commands ===" -ForegroundColor Cyan
Write-Host "View logs: docker logs creator-ai-app-dev -f" -ForegroundColor White
Write-Host "Restart: docker-compose -f docker-compose.dev.yml restart app-dev" -ForegroundColor White