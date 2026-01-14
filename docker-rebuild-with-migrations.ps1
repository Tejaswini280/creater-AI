#!/usr/bin/env pwsh

# ═══════════════════════════════════════════════════════════════════════════════
# DOCKER REBUILD WITH DATABASE MIGRATIONS
# ═══════════════════════════════════════════════════════════════════════════════
# This script rebuilds the Docker container with migration files included
# and runs the comprehensive database schema fix
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🐳 DOCKER REBUILD WITH DATABASE MIGRATIONS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Stop and remove existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# Remove old images to force rebuild
Write-Host "🗑️ Removing old images..." -ForegroundColor Yellow
docker image rm creator-ai-app 2>$null
docker image prune -f

# Build new image with migration files
Write-Host "🔨 Building new Docker image with migration files..." -ForegroundColor Green
docker-compose build --no-cache app

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Green
docker-compose up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if services are running
Write-Host "🔍 Checking service status..." -ForegroundColor Blue
docker-compose ps

# Show application logs
Write-Host "📋 Application startup logs:" -ForegroundColor Blue
docker-compose logs app --tail=50

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ DOCKER REBUILD COMPLETED" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application should be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🗄️ Database migrations should have run automatically" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 To check migration status:" -ForegroundColor Yellow
Write-Host "   docker-compose exec app node scripts/run-migrations.js" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 To check application logs:" -ForegroundColor Yellow
Write-Host "   docker-compose logs app -f" -ForegroundColor Gray