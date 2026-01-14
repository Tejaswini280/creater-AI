# Docker Debug Logs Script
param(
    [string]$Service = "all",
    [int]$Lines = 50
)

Write-Host "=== Docker Debug Logs ===" -ForegroundColor Cyan
Write-Host "Service: $Service | Lines: $Lines" -ForegroundColor Yellow
Write-Host ""

switch ($Service.ToLower()) {
    "app" {
        Write-Host "Application Logs:" -ForegroundColor Green
        docker-compose -f docker-compose.debug.yml logs app --tail=$Lines -f
    }
    "db" {
        Write-Host "Database Logs:" -ForegroundColor Green
        docker-compose -f docker-compose.debug.yml logs postgres --tail=$Lines -f
    }
    "redis" {
        Write-Host "Redis Logs:" -ForegroundColor Green
        docker-compose -f docker-compose.debug.yml logs redis --tail=$Lines -f
    }
    "all" {
        Write-Host "All Service Logs:" -ForegroundColor Green
        docker-compose -f docker-compose.debug.yml logs --tail=$Lines -f
    }
    default {
        Write-Host "Available services: app, db, redis, all" -ForegroundColor Yellow
        Write-Host "Usage: .\docker-debug-logs.ps1 -Service app -Lines 100" -ForegroundColor White
    }
}