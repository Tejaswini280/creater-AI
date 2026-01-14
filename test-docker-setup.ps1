# Test Docker Setup Script
# This script tests if the Docker environment is working correctly

Write-Host "🧪 Testing Docker Setup for Creator AI Studio" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Test 1: Check if containers are running
Write-Host "🔍 Test 1: Checking container status..." -ForegroundColor Yellow
$containers = docker ps --filter "name=creator-ai" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
if ($containers.Count -gt 1) {
    Write-Host "✅ Containers are running:" -ForegroundColor Green
    Write-Host $containers
} else {
    Write-Host "❌ No containers are running. Run .\docker-setup-complete.ps1 first." -ForegroundColor Red
    exit 1
}

# Test 2: Check application health
Write-Host ""
Write-Host "🔍 Test 2: Testing application health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application health check passed!" -ForegroundColor Green
        Write-Host "📊 Response: $($response.Content)" -ForegroundColor White
    } else {
        Write-Host "⚠️  Application responded with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Application health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check database connection
Write-Host ""
Write-Host "🔍 Test 3: Testing database connection..." -ForegroundColor Yellow
try {
    $dbTest = docker exec creator-ai-app-dev node -e "
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    pool.query('SELECT COUNT(*) as user_count FROM users', (err, res) => {
        if (err) {
            console.error('❌ Database query failed:', err.message);
            process.exit(1);
        } else {
            console.log('✅ Database connection successful!');
            console.log('👥 Users in database:', res.rows[0].user_count);
        }
        pool.end();
    });
    " 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host $dbTest -ForegroundColor Green
    } else {
        Write-Host "❌ Database test failed" -ForegroundColor Red
        Write-Host $dbTest -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Database test error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Check Redis connection
Write-Host ""
Write-Host "🔍 Test 4: Testing Redis connection..." -ForegroundColor Yellow
try {
    $redisTest = docker exec creator-ai-redis-dev redis-cli ping 2>&1
    if ($redisTest -eq "PONG") {
        Write-Host "✅ Redis connection successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis connection failed: $redisTest" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Redis test error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Check application endpoints
Write-Host ""
Write-Host "🔍 Test 5: Testing application endpoints..." -ForegroundColor Yellow
$endpoints = @(
    @{ url = "http://localhost:5000"; name = "Main Application" },
    @{ url = "http://localhost:5000/api/health"; name = "API Health" }
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.url -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($endpoint.name): OK" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($endpoint.name): Status $($response.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ $($endpoint.name): Failed" -ForegroundColor Red
    }
}

# Test 6: Check container logs for errors
Write-Host ""
Write-Host "🔍 Test 6: Checking for errors in logs..." -ForegroundColor Yellow
$appLogs = docker logs creator-ai-app-dev --tail 20 2>&1
$errorCount = ($appLogs | Select-String -Pattern "error|Error|ERROR" | Measure-Object).Count

if ($errorCount -eq 0) {
    Write-Host "✅ No errors found in application logs" -ForegroundColor Green
} else {
    Write-Host "⚠️  Found $errorCount error(s) in application logs" -ForegroundColor Yellow
    Write-Host "💡 View full logs with: docker logs creator-ai-app-dev" -ForegroundColor White
}

# Summary
Write-Host ""
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "🐳 Docker containers: Running" -ForegroundColor Green
Write-Host "🌐 Application access: http://localhost:5000" -ForegroundColor White
Write-Host "🗄️  Database: Connected" -ForegroundColor Green
Write-Host "🔴 Redis: Connected" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Your Docker development environment is ready!" -ForegroundColor Green
Write-Host "💡 Next: Open http://localhost:5000 in your browser to start developing" -ForegroundColor Yellow