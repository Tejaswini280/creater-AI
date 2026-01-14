# Docker Development Startup Script
# This script starts the development environment with Docker

Write-Host "🐳 Starting Creator AI Studio - Development Environment" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Check if Docker Desktop is running
Write-Host "📋 Checking Docker Desktop status..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "💡 Open Docker Desktop and wait for it to start, then run this script again." -ForegroundColor Yellow
    pause
    exit 1
}

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

# Remove old volumes if requested
$cleanVolumes = Read-Host "🗑️  Do you want to clean database volumes? (y/N)"
if ($cleanVolumes -eq "y" -or $cleanVolumes -eq "Y") {
    Write-Host "🧹 Cleaning volumes..." -ForegroundColor Yellow
    docker volume rm creator-ai_postgres_dev_data -f 2>$null
    docker volume rm creator-ai_redis_dev_data -f 2>$null
    Write-Host "✅ Volumes cleaned" -ForegroundColor Green
}

# Build and start containers
Write-Host "🔨 Building and starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
$maxWait = 60
$waited = 0

while ($waited -lt $maxWait) {
    $postgresHealth = docker inspect creator-ai-postgres-dev --format="{{.State.Health.Status}}" 2>$null
    $redisHealth = docker inspect creator-ai-redis-dev --format="{{.State.Health.Status}}" 2>$null
    
    if ($postgresHealth -eq "healthy" -and $redisHealth -eq "healthy") {
        Write-Host "✅ Database services are ready!" -ForegroundColor Green
        break
    }
    
    Write-Host "⏳ Waiting for database services... ($waited/$maxWait seconds)" -ForegroundColor Yellow
    Start-Sleep 2
    $waited += 2
}

if ($waited -ge $maxWait) {
    Write-Host "⚠️  Services took longer than expected to start. Check logs with:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.dev.yml logs" -ForegroundColor White
}

# Show container status
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "🎉 Development environment is starting!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "📱 Application: http://localhost:5000" -ForegroundColor White
Write-Host "🗄️  Database: localhost:5432 (postgres/postgres123)" -ForegroundColor White
Write-Host "🔴 Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📋 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs: docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor White
Write-Host "   Stop: docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "   Restart app: docker-compose -f docker-compose.dev.yml restart app-dev" -ForegroundColor White
Write-Host "   Shell into app: docker exec -it creator-ai-app-dev sh" -ForegroundColor White
Write-Host ""

# Ask if user wants to view logs
$viewLogs = Read-Host "📋 Do you want to view application logs? (y/N)"
if ($viewLogs -eq "y" -or $viewLogs -eq "Y") {
    Write-Host "📋 Showing application logs (Press Ctrl+C to exit)..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml logs -f app-dev
}