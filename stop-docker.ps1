#!/usr/bin/env pwsh

Write-Host "🛑 Stopping Creator AI Studio Docker containers..." -ForegroundColor Yellow

# Stop all services
docker-compose down

Write-Host "✅ All containers stopped" -ForegroundColor Green

# Optional: Remove volumes (uncomment if you want to clear all data)
# Write-Host "🗑️ Removing volumes..." -ForegroundColor Yellow
# docker-compose down -v
# Write-Host "✅ Volumes removed" -ForegroundColor Green