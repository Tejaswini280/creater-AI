# Docker Test Script
# This script tests the Docker development environment

Write-Host "🧪 Creator AI Studio - Docker Environment Test" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check if containers are running
Write-Host "1. 📊 Checking container status..." -ForegroundColor Yellow
$containers = docker ps --filter "name=creator-ai" --format "{{.Names}}" 2>$null
if ($containers.Count -eq 0) {
    Write-Host "❌ No containers are running. Please start the development environment first." -ForegroundColor Red
    Write-Host "💡 Run: .\docker-start-dev.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found running containers: $($containers -join ', ')" -ForegroundColor Green

# Test database connection
Write-Host "2. 🗄️  Testing database connection..." -ForegroundColor Yellow
$dbTest = docker exec creator-ai-app-dev node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('ERROR: ' + err.message);
        process.exit(1);
    } else {
        console.log('SUCCESS: Database connected');
        process.exit(0);
    }
});
" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database connection successful" -ForegroundColor Green
} else {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
}

# Test Redis connection
Write-Host "3. 🔴 Testing Redis connection..." -ForegroundColor Yellow
$redisTest = docker exec creator-ai-redis-dev redis-cli ping 2>$null
if ($redisTest -eq "PONG") {
    Write-Host "✅ Redis connection successful" -ForegroundColor Green
} else {
    Write-Host "❌ Redis connection failed" -ForegroundColor Red
}

# Test application health endpoint
Write-Host "4. 🌐 Testing application health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application health endpoint responding" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Application health endpoint returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Application health endpoint not responding" -ForegroundColor Red
    Write-Host "💡 The application might still be starting up. Wait a moment and try again." -ForegroundColor Yellow
}

# Test application main page
Write-Host "5. 🏠 Testing application main page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 10 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application main page responding" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Application main page returned status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Application main page not responding" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Test Summary:" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host "📱 Application URL: http://localhost:5000" -ForegroundColor White
Write-Host "🗄️  Database: localhost:5432" -ForegroundColor White
Write-Host "🔴 Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "💡 If any tests failed, try:" -ForegroundColor Yellow
Write-Host "   - Wait a few more seconds for services to fully start" -ForegroundColor White
Write-Host "   - Check logs: .\docker-logs.ps1" -ForegroundColor White
Write-Host "   - Debug: .\docker-debug.ps1" -ForegroundColor White
Write-Host "   - Restart: docker-compose -f docker-compose.dev.yml restart" -ForegroundColor White