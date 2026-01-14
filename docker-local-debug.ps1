# Creator AI Studio - Local Docker Debug Setup
Write-Host "=== Creator AI Studio - Local Docker Debug ===" -ForegroundColor Cyan

# Function to check if Docker is running
function Test-DockerRunning {
    try {
        docker version | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to wait for service health
function Wait-ForService {
    param($ServiceName, $Url, $MaxAttempts = 30)
    
    Write-Host "Waiting for $ServiceName to be healthy..." -ForegroundColor Yellow
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "$ServiceName is healthy!" -ForegroundColor Green
                return $true
            }
        } catch {
            Write-Host "Attempt $i/$MaxAttempts - $ServiceName not ready yet..." -ForegroundColor Yellow
            Start-Sleep 2
        }
    }
    Write-Host "$ServiceName failed to become healthy" -ForegroundColor Red
    return $false
}

# Check Docker Desktop
if (-not (Test-DockerRunning)) {
    Write-Host "Docker Desktop is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "Docker Desktop is running ✓" -ForegroundColor Green

# Clean up existing containers and images
Write-Host ""
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose down -v --remove-orphans 2>$null
docker system prune -f 2>$null

# Remove existing images to force rebuild
Write-Host "Removing existing images for fresh build..." -ForegroundColor Yellow
docker rmi creator-ai-studio-app 2>$null
docker rmi creator-ai-studio_app 2>$null

# Create production environment file for Docker
Write-Host ""
Write-Host "Setting up environment for Docker..." -ForegroundColor Yellow
$dockerEnv = @"
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/creators_dev_db
REDIS_URL=redis://redis:6379

# AI API Keys (you may need to update these)
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
KLING_ACCESS_KEY=your_kling_access_key_here
KLING_SECRET_KEY=your_kling_secret_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Session & Auth
SESSION_SECRET=CreatorNexus-Docker-Secret-2024
JWT_SECRET=CreatorNexus-JWT-Docker-2024
JWT_REFRESH_SECRET=CreatorNexus-Refresh-Docker-2024

# Docker Settings
SKIP_RATE_LIMIT=1
PERF_MODE=0
"@

$dockerEnv | Out-File -FilePath ".env.docker" -Encoding UTF8 -Force
Write-Host "Docker environment configured ✓" -ForegroundColor Green

# Build and start services
Write-Host ""
Write-Host "Building Docker images..." -ForegroundColor Yellow
docker-compose build --no-cache

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for database
Write-Host ""
if (Wait-ForService "PostgreSQL" "http://localhost:5432" 15) {
    Write-Host "Database is ready ✓" -ForegroundColor Green
} else {
    Write-Host "Database failed to start" -ForegroundColor Red
}

# Wait for Redis
if (Wait-ForService "Redis" "http://localhost:6379" 10) {
    Write-Host "Redis is ready ✓" -ForegroundColor Green
} else {
    Write-Host "Redis may not be ready" -ForegroundColor Yellow
}

# Wait for application
Write-Host ""
if (Wait-ForService "Application" "http://localhost:5000/api/health" 60) {
    Write-Host "Application is ready ✓" -ForegroundColor Green
} else {
    Write-Host "Application failed to start properly" -ForegroundColor Red
    Write-Host "Checking logs..." -ForegroundColor Yellow
    docker-compose logs app --tail=20
}

# Show final status
Write-Host ""
Write-Host "=== Docker Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
Write-Host "  • Application: http://localhost:5000" -ForegroundColor White
Write-Host "  • Database: localhost:5432 (postgres/postgres123)" -ForegroundColor White
Write-Host "  • Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "Container Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  • View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "  • View app logs: docker-compose logs -f app" -ForegroundColor White
Write-Host "  • Stop services: docker-compose down" -ForegroundColor White
Write-Host "  • Restart app: docker-compose restart app" -ForegroundColor White
Write-Host "  • Shell into app: docker-compose exec app sh" -ForegroundColor White

Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")