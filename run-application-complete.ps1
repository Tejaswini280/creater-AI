#!/usr/bin/env pwsh

Write-Host "🚀 Starting CreatorAI Studio Application..." -ForegroundColor Green

# Check if Docker Desktop is running
Write-Host "🐳 Checking Docker status..." -ForegroundColor Cyan
$dockerRunning = $false
try {
    docker version | Out-Null
    $dockerRunning = $true
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running" -ForegroundColor Red
    Write-Host "🔧 Please start Docker Desktop and wait for it to be ready" -ForegroundColor Yellow
    Write-Host "   Then run this script again" -ForegroundColor Yellow
    
    # Try to start Docker Desktop
    Write-Host "🚀 Attempting to start Docker Desktop..." -ForegroundColor Cyan
    try {
        Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -WindowStyle Hidden
        Write-Host "⏳ Docker Desktop is starting... Please wait 30-60 seconds" -ForegroundColor Yellow
        Write-Host "   Then run this script again when Docker is ready" -ForegroundColor Yellow
        exit 1
    } catch {
        Write-Host "❌ Could not start Docker Desktop automatically" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop manually and run this script again" -ForegroundColor Yellow
        exit 1
    }
}

if ($dockerRunning) {
    Write-Host ""
    Write-Host "🏗️ Building and starting application containers..." -ForegroundColor Green
    
    # Stop any existing containers
    Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
    docker-compose down 2>$null
    
    # Start the application
    Write-Host "🚀 Starting CreatorAI Studio..." -ForegroundColor Cyan
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Application started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Container Status:" -ForegroundColor Yellow
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        
        Write-Host ""
        Write-Host "⏳ Waiting for application to be ready..." -ForegroundColor Cyan
        Start-Sleep -Seconds 10
        
        # Check application health
        Write-Host "🔍 Checking application health..." -ForegroundColor Cyan
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -TimeoutSec 10
            Write-Host "✅ Application is healthy!" -ForegroundColor Green
            Write-Host "   Status: $($response.status)" -ForegroundColor White
            Write-Host "   Environment: $($response.environment)" -ForegroundColor White
        } catch {
            Write-Host "⚠️ Application is starting up... This may take a moment" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "🌐 Your CreatorAI Studio is ready!" -ForegroundColor Green
        Write-Host "   📱 Application: http://localhost:5000" -ForegroundColor Cyan
        Write-Host "   🔍 API Health: http://localhost:5000/api/health" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "🎯 Features Available:" -ForegroundColor Yellow
        Write-Host "   ✅ AI Content Generation" -ForegroundColor White
        Write-Host "   ✅ Social Media Scheduling" -ForegroundColor White
        Write-Host "   ✅ Analytics Dashboard" -ForegroundColor White
        Write-Host "   ✅ Project Management" -ForegroundColor White
        Write-Host "   ✅ Template Library" -ForegroundColor White
        Write-Host ""
        Write-Host "🚀 Open http://localhost:5000 in your browser to get started!" -ForegroundColor Green
        
    } else {
        Write-Host "❌ Failed to start application" -ForegroundColor Red
        Write-Host "📋 Checking logs..." -ForegroundColor Yellow
        docker-compose logs --tail 20
    }
}