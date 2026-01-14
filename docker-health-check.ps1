# Docker Health Check Script
Write-Host "=== Docker Health Check ===" -ForegroundColor Cyan

# Function to test endpoint
function Test-Endpoint {
    param($Url, $Name)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✓ $Name - Status: $($response.StatusCode)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "✗ $Name - Failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check container status
Write-Host ""
Write-Host "Container Status:" -ForegroundColor Yellow
docker-compose -f docker-compose.debug.yml ps

Write-Host ""
Write-Host "Health Checks:" -ForegroundColor Yellow

# Test database connection
Write-Host "Testing database connection..." -ForegroundColor Yellow
try {
    $dbTest = docker-compose -f docker-compose.debug.yml exec -T postgres pg_isready -U postgres
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database - Connected" -ForegroundColor Green
    } else {
        Write-Host "✗ Database - Connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Database - Connection test failed" -ForegroundColor Red
}

# Test Redis connection
Write-Host "Testing Redis connection..." -ForegroundColor Yellow
try {
    $redisTest = docker-compose -f docker-compose.debug.yml exec -T redis redis-cli ping
    if ($redisTest -match "PONG") {
        Write-Host "✓ Redis - Connected" -ForegroundColor Green
    } else {
        Write-Host "✗ Redis - Connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Redis - Connection test failed" -ForegroundColor Red
}

# Test application endpoints
Write-Host "Testing application endpoints..." -ForegroundColor Yellow
Test-Endpoint "http://localhost:5000/api/health" "Health Endpoint"
Test-Endpoint "http://localhost:5000" "Main Application"

# Show recent logs
Write-Host ""
Write-Host "Recent Application Logs:" -ForegroundColor Yellow
docker-compose -f docker-compose.debug.yml logs app --tail=10

Write-Host ""
Write-Host "=== Health Check Complete ===" -ForegroundColor Cyan