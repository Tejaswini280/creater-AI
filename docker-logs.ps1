# Docker Logs Viewer Script
# This script helps you view logs from different services

Write-Host "📋 Creator AI Studio - Docker Logs Viewer" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if containers are running
$containers = docker ps --filter "name=creator-ai" --format "table {{.Names}}\t{{.Status}}"
if ($containers.Count -le 1) {
    Write-Host "❌ No Creator AI containers are running." -ForegroundColor Red
    Write-Host "💡 Start the development environment first with: .\docker-start-dev.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "🐳 Running containers:" -ForegroundColor Green
Write-Host $containers

Write-Host ""
Write-Host "📋 Select logs to view:" -ForegroundColor Cyan
Write-Host "1. Application logs (app-dev)" -ForegroundColor White
Write-Host "2. Database logs (postgres-dev)" -ForegroundColor White
Write-Host "3. Redis logs (redis-dev)" -ForegroundColor White
Write-Host "4. All services logs" -ForegroundColor White
Write-Host "5. Follow application logs (live)" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "📋 Showing application logs..." -ForegroundColor Yellow
        docker logs creator-ai-app-dev
    }
    "2" {
        Write-Host "📋 Showing database logs..." -ForegroundColor Yellow
        docker logs creator-ai-postgres-dev
    }
    "3" {
        Write-Host "📋 Showing Redis logs..." -ForegroundColor Yellow
        docker logs creator-ai-redis-dev
    }
    "4" {
        Write-Host "📋 Showing all service logs..." -ForegroundColor Yellow
        docker-compose -f docker-compose.dev.yml logs
    }
    "5" {
        Write-Host "📋 Following application logs (Press Ctrl+C to exit)..." -ForegroundColor Yellow
        docker-compose -f docker-compose.dev.yml logs -f app-dev
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    }
}