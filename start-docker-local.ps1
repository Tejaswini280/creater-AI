#!/usr/bin/env pwsh

# CreatorNexus Docker + Local Development Setup
# This script starts PostgreSQL and Redis in Docker containers
# and runs the application locally connecting to the Docker database

Write-Host "🚀 Starting CreatorNexus with Docker Database..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start database and Redis containers
Write-Host "🗄️  Starting PostgreSQL and Redis containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.db-only.yml up -d

# Wait for containers to be healthy
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

do {
    $attempt++
    Start-Sleep -Seconds 2
    $postgresHealth = docker inspect creator-ai-postgres --format='{{.State.Health.Status}}' 2>$null
    $redisHealth = docker inspect creator-ai-redis --format='{{.State.Health.Status}}' 2>$null
    
    if ($postgresHealth -eq "healthy" -and $redisHealth -eq "healthy") {
        Write-Host "✅ Database and Redis are healthy!" -ForegroundColor Green
        break
    }
    
    if ($attempt -ge $maxAttempts) {
        Write-Host "❌ Timeout waiting for containers to be healthy" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "⏳ Attempt $attempt/$maxAttempts - Waiting for containers..." -ForegroundColor Yellow
} while ($true)

Write-Host ""
Write-Host "🌐 Starting CreatorNexus application..." -ForegroundColor Green
Write-Host "📊 Database: PostgreSQL running in Docker (localhost:5432)" -ForegroundColor Cyan
Write-Host "🔄 Cache: Redis running in Docker (localhost:6379)" -ForegroundColor Cyan
Write-Host "🚀 App: Running locally with hot reload" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔗 Application will be available at: http://localhost:5000" -ForegroundColor Magenta
Write-Host "📊 Health check: http://localhost:5000/api/health" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Yellow
Write-Host "To stop Docker containers, run: docker-compose -f docker-compose.db-only.yml down" -ForegroundColor Yellow
Write-Host ""

# Start the application
npm run dev