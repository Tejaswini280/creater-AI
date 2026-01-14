# Docker Setup Script for Creator AI Studio
Write-Host "🐳 Creator AI Studio - Docker Setup Guide" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Docker is installed
$dockerInstalled = $false
try {
    docker --version | Out-Null
    $dockerInstalled = $true
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
}

if (-not $dockerInstalled) {
    Write-Host ""
    Write-Host "📥 To install Docker:" -ForegroundColor Yellow
    Write-Host "1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    Write-Host "2. Install and start Docker Desktop" -ForegroundColor White
    Write-Host "3. Run this script again" -ForegroundColor White
    Write-Host ""
    Write-Host "🔄 Alternative: Use existing development setup with 'npm run dev'" -ForegroundColor Cyan
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting Creator AI Studio with Docker..." -ForegroundColor Cyan

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Build and start services
Write-Host "🏗️ Building and starting services..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes on first run..." -ForegroundColor Gray

try {
    docker-compose up --build -d
    
    Write-Host ""
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # Check service status
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "🎉 Creator AI Studio is running!" -ForegroundColor Green
    Write-Host "🌐 Application: http://localhost:5000" -ForegroundColor Green
    Write-Host "🗄️ Database: PostgreSQL on localhost:5432" -ForegroundColor Green
    Write-Host "🔄 Redis: localhost:6379" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📋 Useful Commands:" -ForegroundColor Yellow
    Write-Host "   View logs: docker-compose logs -f app" -ForegroundColor White
    Write-Host "   Stop all: docker-compose down" -ForegroundColor White
    Write-Host "   Restart: docker-compose restart app" -ForegroundColor White
    Write-Host "   Shell access: docker-compose exec app sh" -ForegroundColor White
    
} catch {
    Write-Host "❌ Failed to start services. Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure Docker Desktop is running" -ForegroundColor White
    Write-Host "2. Check if ports 5000, 5432, 6379 are available" -ForegroundColor White
    Write-Host "3. Try: docker-compose down && docker-compose up --build" -ForegroundColor White
}