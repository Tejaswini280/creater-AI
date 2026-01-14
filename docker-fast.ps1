# Fast Docker Setup
Write-Host "Starting Docker containers..." -ForegroundColor Green

# Set Docker path
$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$dockerComposePath = "C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe"

# Clean up
& $dockerComposePath -f docker-compose.dev.yml down -v 2>$null

# Start containers
& $dockerComposePath -f docker-compose.dev.yml up --build -d

Write-Host "Containers starting..." -ForegroundColor Yellow
Write-Host "Check status: docker-compose -f docker-compose.dev.yml ps" -ForegroundColor White
Write-Host "View logs: docker-compose -f docker-compose.dev.yml logs -f app-dev" -ForegroundColor White
Write-Host "Application will be at: http://localhost:5000" -ForegroundColor Green