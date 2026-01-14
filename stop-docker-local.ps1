#!/usr/bin/env pwsh

# Stop CreatorNexus Docker containers

Write-Host "🛑 Stopping CreatorNexus Docker containers..." -ForegroundColor Yellow

# Stop the containers
docker-compose -f docker-compose.db-only.yml down

Write-Host "✅ Docker containers stopped successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To start again, run: ./start-docker-local.ps1" -ForegroundColor Cyan