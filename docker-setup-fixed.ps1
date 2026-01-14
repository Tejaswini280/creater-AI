# Fixed Docker Setup Script
Write-Host "Starting Docker Setup..." -ForegroundColor Green

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down -v

# Build and start services
Write-Host "Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build -d

# Wait for services to start
Write-Host "Waiting 30 seconds for services to initialize..." -ForegroundColor Yellow
Start-Sleep 30

# Check if services are running
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Test the application
Write-Host "Testing application health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Application is running successfully!" -ForegroundColor Green
        Write-Host "✓ Access your app at: http://localhost:5000" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Application responded with status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Application is not responding. Checking logs..." -ForegroundColor Red
    Write-Host "Run 'docker-compose logs app' to see application logs" -ForegroundColor Yellow
    Write-Host "Run 'docker-compose logs postgres' to see database logs" -ForegroundColor Yellow
}

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs: docker-compose logs -f app" -ForegroundColor White
Write-Host "  Stop services: docker-compose down" -ForegroundColor White
Write-Host "  Restart: docker-compose restart app" -ForegroundColor White