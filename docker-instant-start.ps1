Write-Host "🚀 STARTING DOCKER APPLICATION INSTANTLY" -ForegroundColor Cyan

# Start all services
docker-compose up -d

Write-Host "⏳ Waiting for containers to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if app is running
$appStatus = docker ps --filter "name=creator-ai-app" --format "table {{.Names}}\t{{.Status}}"
Write-Host "📊 Container Status:" -ForegroundColor Green
Write-Host $appStatus

# Test if application is accessible
Write-Host "🌐 Testing application accessibility..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Application is accessible at http://localhost:5000" -ForegroundColor Green
    Write-Host "📊 Health check response: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Application not yet accessible, checking logs..." -ForegroundColor Yellow
    docker logs creator-ai-app --tail 10
}

Write-Host "🎯 Application should be running at: http://localhost:5000" -ForegroundColor Cyan