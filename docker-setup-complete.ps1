# Complete Docker Setup for Creator AI Studio
# This script sets up a fully working Docker development environment

Write-Host "🐳 Creator AI Studio - Complete Docker Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Step 1: Fix Docker credentials
Write-Host "🔧 Step 1: Fixing Docker credentials..." -ForegroundColor Yellow
$dockerConfigDir = "$env:USERPROFILE\.docker"
if (!(Test-Path $dockerConfigDir)) {
    New-Item -ItemType Directory -Path $dockerConfigDir -Force | Out-Null
}

$configContent = @"
{
  "auths": {},
  "credsStore": ""
}
"@

$configContent | Out-File -FilePath "$dockerConfigDir\config.json" -Encoding UTF8 -Force
Write-Host "✅ Docker credentials configured" -ForegroundColor Green

# Step 2: Check Docker Desktop
Write-Host "🔍 Step 2: Checking Docker Desktop..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running. Please start Docker Desktop first." -ForegroundColor Red
    Write-Host "💡 Open Docker Desktop and wait for it to start, then run this script again." -ForegroundColor Yellow
    pause
    exit 1
}

# Step 3: Clean up existing containers and volumes
Write-Host "🧹 Step 3: Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml down -v --remove-orphans 2>$null
docker system prune -f 2>$null

# Remove specific volumes
docker volume rm creator-ai_postgres_dev_data -f 2>$null
docker volume rm creator-ai_redis_dev_data -f 2>$null
docker volume rm creator-ai_dev_logs -f 2>$null

Write-Host "✅ Cleanup completed" -ForegroundColor Green

# Step 4: Create database initialization script
Write-Host "🗄️  Step 4: Preparing database schema..." -ForegroundColor Yellow

# Copy the existing schema file
Copy-Item "create-full-schema.sql" "docker-init-db.sql" -Force
Write-Host "✅ Database schema prepared" -ForegroundColor Green

# Step 5: Update docker-compose.dev.yml to use the new init script
Write-Host "🔧 Step 5: Updating Docker Compose configuration..." -ForegroundColor Yellow

# Create the docker-compose.dev.yml content
$dockerComposeContent = @'
services:
  # PostgreSQL Database for Development
  postgres-dev:
    image: postgres:15-alpine
    container_name: creator-ai-postgres-dev
    environment:
      POSTGRES_DB: creators_dev_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./docker-init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - creator-ai-dev-network

  # Redis for Development
  redis-dev:
    image: redis:7-alpine
    container_name: creator-ai-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - creator-ai-dev-network

  # Development Application with Hot Reload
  app-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: creator-ai-app-dev
    ports:
      - "5000:5000"
      - "5173:5173"  # Vite dev server
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres123@postgres-dev:5432/creators_dev_db
      - REDIS_URL=redis://redis-dev:6379
      - PORT=5000
      - SKIP_RATE_LIMIT=1
      - PERF_MODE=1
      - DEBUG=true
      - LOG_LEVEL=debug
    env_file:
      - .env.development
    depends_on:
      postgres-dev:
        condition: service_healthy
      redis-dev:
        condition: service_healthy
    volumes:
      # Mount source code for hot reload
      - .:/app
      - /app/node_modules
      - ./uploads:/app/uploads
      - dev_logs:/app/logs
    command: npm run dev
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - creator-ai-dev-network

volumes:
  postgres_dev_data:
    driver: local
  redis_dev_data:
    driver: local
  dev_logs:
    driver: local

networks:
  creator-ai-dev-network:
    driver: bridge
'@

$dockerComposeContent | Out-File -FilePath "docker-compose.dev.yml" -Encoding UTF8 -Force
Write-Host "✅ Docker Compose configuration updated" -ForegroundColor Green

# Step 6: Build and start containers
Write-Host "🔨 Step 6: Building and starting containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up --build -d

# Step 7: Wait for services to be healthy
Write-Host "⏳ Step 7: Waiting for services to be ready..." -ForegroundColor Yellow
$maxWait = 120
$waited = 0

while ($waited -lt $maxWait) {
    $postgresHealth = docker inspect creator-ai-postgres-dev --format="{{.State.Health.Status}}" 2>$null
    $redisHealth = docker inspect creator-ai-redis-dev --format="{{.State.Health.Status}}" 2>$null
    $appHealth = docker inspect creator-ai-app-dev --format="{{.State.Health.Status}}" 2>$null
    
    Write-Host "⏳ Services status: DB=$postgresHealth, Redis=$redisHealth, App=$appHealth ($waited/$maxWait seconds)" -ForegroundColor Yellow
    
    if ($postgresHealth -eq "healthy" -and $redisHealth -eq "healthy" -and $appHealth -eq "healthy") {
        Write-Host "✅ All services are ready!" -ForegroundColor Green
        break
    }
    
    Start-Sleep 3
    $waited += 3
}

# Step 8: Test the application
Write-Host "🧪 Step 8: Testing application..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Application is responding!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Application responded with status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Application health check failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "💡 Check logs with: docker-compose -f docker-compose.dev.yml logs app-dev" -ForegroundColor White
}

# Step 9: Show final status
Write-Host ""
Write-Host "🎉 Docker Setup Complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "📱 Application: http://localhost:5000" -ForegroundColor White
Write-Host "🗄️  Database: localhost:5432 (postgres/postgres123)" -ForegroundColor White
Write-Host "🔴 Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:5000 in your browser" -ForegroundColor White
Write-Host "2. Use the test user: docker@example.com" -ForegroundColor White
Write-Host "3. View logs: docker-compose -f docker-compose.dev.yml logs -f app-dev" -ForegroundColor White
Write-Host "4. Debug: .\docker-debug.ps1" -ForegroundColor White
Write-Host ""

# Ask if user wants to view logs
$viewLogs = Read-Host "📋 Do you want to view application logs now? (y/N)"
if ($viewLogs -eq "y" -or $viewLogs -eq "Y") {
    Write-Host "📋 Showing application logs (Press Ctrl+C to exit)..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml logs -f app-dev
}