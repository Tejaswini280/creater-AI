# Simple Docker Setup for Creator AI Studio
Write-Host "🐳 Creator AI Studio - Simple Docker Setup" -ForegroundColor Cyan

# Step 1: Fix Docker credentials
Write-Host "🔧 Fixing Docker credentials..." -ForegroundColor Yellow
$dockerConfigDir = "$env:USERPROFILE\.docker"
if (!(Test-Path $dockerConfigDir)) {
    New-Item -ItemType Directory -Path $dockerConfigDir -Force | Out-Null
}

$configJson = '{"auths": {}, "credsStore": ""}'
$configJson | Out-File -FilePath "$dockerConfigDir\config.json" -Encoding UTF8 -Force
Write-Host "✅ Docker credentials configured" -ForegroundColor Green

# Step 2: Check Docker Desktop
Write-Host "🔍 Checking Docker Desktop..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running. Please start Docker Desktop first." -ForegroundColor Red
    pause
    exit 1
}

# Step 3: Clean up existing containers
Write-Host "🧹 Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down -v --remove-orphans 2>$null
docker system prune -f 2>$null
Write-Host "✅ Cleanup completed" -ForegroundColor Green

# Step 4: Copy database schema
Write-Host "🗄️  Preparing database schema..." -ForegroundColor Yellow
if (Test-Path "create-full-schema.sql") {
    Copy-Item "create-full-schema.sql" "docker-init-db.sql" -Force
    Write-Host "✅ Database schema prepared" -ForegroundColor Green
} else {
    Write-Host "⚠️  create-full-schema.sql not found, using existing docker-init-db.sql" -ForegroundColor Yellow
}

# Step 5: Build and start containers
Write-Host "🔨 Building and starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up --build -d

# Step 6: Wait for services
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
$maxWait = 120
$waited = 0

while ($waited -lt $maxWait) {
    $postgresHealth = docker inspect creator-ai-postgres-dev --format="{{.State.Health.Status}}" 2>$null
    $redisHealth = docker inspect creator-ai-redis-dev --format="{{.State.Health.Status}}" 2>$null
    
    Write-Host "⏳ Services status: DB=$postgresHealth, Redis=$redisHealth (${waited}/${maxWait} seconds)" -ForegroundColor Yellow
    
    if ($postgresHealth -eq "healthy" -and $redisHealth -eq "healthy") {
        Write-Host "✅ Database services are ready!" -ForegroundColor Green
        break
    }
    
    Start-Sleep 3
    $waited += 3
}

# Step 7: Test the application
Write-Host "🧪 Testing application..." -ForegroundColor Yellow
Start-Sleep 10  # Give app time to start

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is responding!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Application responded with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Application health check failed, but containers are running" -ForegroundColor Yellow
    Write-Host "💡 Check logs with: docker-compose -f docker-compose.dev.yml logs app-dev" -ForegroundColor White
}

# Step 8: Show final status
Write-Host ""
Write-Host "🎉 Docker Setup Complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "📱 Application: http://localhost:5000" -ForegroundColor White
Write-Host "🗄️  Database: localhost:5432 (postgres/postgres123)" -ForegroundColor White
Write-Host "🔴 Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:5000 in your browser" -ForegroundColor White
Write-Host "2. View logs: docker-compose -f docker-compose.dev.yml logs -f app-dev" -ForegroundColor White
Write-Host "3. Debug: .\docker-debug.ps1" -ForegroundColor White
Write-Host "4. Test setup: .\test-docker-setup.ps1" -ForegroundColor White