#!/usr/bin/env pwsh

Write-Host "🐳 Starting Creator AI Studio with Docker..." -ForegroundColor Cyan

# Check if Docker is running
try {
    docker version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Remove any existing volumes (optional - uncomment if you want fresh data)
# Write-Host "🗑️ Removing existing volumes..." -ForegroundColor Yellow
# docker-compose down -v

# Build and start services
Write-Host "🏗️ Building and starting services..." -ForegroundColor Cyan
docker-compose up --build -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "📊 Checking service status..." -ForegroundColor Cyan
docker-compose ps

# Show logs
Write-Host "📋 Application logs:" -ForegroundColor Cyan
docker-compose logs app --tail=20

Write-Host ""
Write-Host "🎉 Creator AI Studio should be running at: http://localhost:5000" -ForegroundColor Green
Write-Host "📊 Database: PostgreSQL on localhost:5432" -ForegroundColor Green
Write-Host "🔄 Redis: localhost:6379" -ForegroundColor Green
Write-Host ""
Write-Host "To view logs: docker-compose logs -f app" -ForegroundColor Yellow
Write-Host "To stop: docker-compose down" -ForegroundColor Yellow
Write-Host "To restart: docker-compose restart app" -ForegroundColor Yellow