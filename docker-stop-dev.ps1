# Docker Development Stop Script
# This script stops the development environment

Write-Host "🛑 Stopping Creator AI Studio - Development Environment" -ForegroundColor Red
Write-Host "=================================================" -ForegroundColor Red

# Stop containers
Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down

# Ask if user wants to remove volumes
$removeVolumes = Read-Host "🗑️  Do you want to remove database volumes? (y/N)"
if ($removeVolumes -eq "y" -or $removeVolumes -eq "Y") {
    Write-Host "🧹 Removing volumes..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml down -v
    Write-Host "✅ Volumes removed" -ForegroundColor Green
}

# Show remaining containers
Write-Host "📊 Remaining containers:" -ForegroundColor Cyan
docker ps -a --filter "name=creator-ai"

Write-Host ""
Write-Host "✅ Development environment stopped!" -ForegroundColor Green