#!/usr/bin/env pwsh

Write-Host "=== DOCKER APPLICATION HEALTH CHECK ===" -ForegroundColor Green

# Step 1: Container Status
Write-Host "1. Container Status:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Step 2: Application Logs
Write-Host "`n2. Application Logs (last 10 lines):" -ForegroundColor Cyan
docker logs creator-ai-app --tail 10

# Step 3: Health Endpoints
Write-Host "`n3. Testing Health Endpoints:" -ForegroundColor Cyan

# Backend Health
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 5
    Write-Host "✅ Backend Health: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend Health: $($_.Exception.Message)" -ForegroundColor Red
}

# Frontend
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 5
    Write-Host "✅ Frontend: $($frontend.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Auth Flow Test
Write-Host "`n4. Testing Auth Flow:" -ForegroundColor Cyan

# Test login endpoint
try {
    $loginData = @{
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -TimeoutSec 5
    Write-Host "✅ Login API: Accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Login API: $($_.Exception.Message)" -ForegroundColor Red
}

# Test auth status
try {
    $authStatus = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/status" -TimeoutSec 5
    Write-Host "✅ Auth Status: $($authStatus.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Auth Status: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Database Connection
Write-Host "`n5. Testing Database:" -ForegroundColor Cyan
try {
    docker exec creator-ai-postgres pg_isready -U postgres
    Write-Host "✅ Database: Connected" -ForegroundColor Green
} catch {
    Write-Host "❌ Database: Connection failed" -ForegroundColor Red
}

Write-Host "`n=== HEALTH CHECK COMPLETE ===" -ForegroundColor Green