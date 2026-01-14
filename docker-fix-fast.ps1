#!/usr/bin/env pwsh

Write-Host "🚀 FAST Docker Fix & Health Check" -ForegroundColor Green

# Clean up
docker-compose down -v
docker system prune -f

# Start fresh
docker-compose up -d

# Wait for services
Write-Host "⏳ Waiting for services..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check status
docker ps

# Test health endpoints
Write-Host "🔍 Testing application health..." -ForegroundColor Cyan

# Test backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5
    Write-Host "✅ Backend Health: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Health: FAILED" -ForegroundColor Red
}

# Test frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 5
    Write-Host "✅ Frontend: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend: FAILED" -ForegroundColor Red
}

# Test auth endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/status" -TimeoutSec 5
    Write-Host "✅ Auth Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth Status: FAILED" -ForegroundColor Red
}

Write-Host "Health check complete!" -ForegroundColor Green