# Fix Docker Application Access
# This script fixes the Docker setup to make the application accessible

Write-Host "🔧 Fixing Docker Application Access..." -ForegroundColor Green

# Step 1: Stop current containers
Write-Host "1. Stopping current containers..." -ForegroundColor Yellow
docker-compose down

# Step 2: Remove old containers and images
Write-Host "2. Cleaning up old containers..." -ForegroundColor Yellow
docker container prune -f
docker image rm creatornexus-app -f 2>$null

# Step 3: Update environment for proper access
Write-Host "3. Setting up environment..." -ForegroundColor Yellow

# Create a development-specific docker-compose override
$dockerOverride = @"
version: '3.8'

services:
  app:
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres123@postgres:5432/creators_dev_db
      - REDIS_URL=redis://redis:6379
      - PORT=5000
      - JWT_SECRET=CreatorNexus-JWT-Secret-2024-Development
      - JWT_REFRESH_SECRET=CreatorNexus-Refresh-Secret-2024-Development
      - SESSION_SECRET=CreatorNexus-Dev-Secret-2024-Change-In-Production
      - SKIP_RATE_LIMIT=1
      - PERF_MODE=0
      - CORS_ORIGIN=http://localhost:5000
      - SECURE_COOKIES=false
      - TRUST_PROXY=false
    ports:
      - "5000:5000"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
"@

$dockerOverride | Out-File -FilePath "docker-compose.override.yml" -Encoding UTF8

Write-Host "4. Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build -d

Write-Host "5. Waiting for containers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host "6. Checking container status..." -ForegroundColor Yellow
docker-compose ps

Write-Host "7. Testing application access..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 1

while ($attempt -le $maxAttempts) {
    try {
        Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
        $response = Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ SUCCESS: Application is accessible!" -ForegroundColor Green
            Write-Host "🌐 Open your browser and go to: http://localhost:5000" -ForegroundColor Cyan
            break
        }
    } catch {
        if ($attempt -eq $maxAttempts) {
            Write-Host "❌ Failed to connect after $maxAttempts attempts" -ForegroundColor Red
            Write-Host "🔍 Checking application logs..." -ForegroundColor Yellow
            docker logs creator-ai-app --tail 20
        } else {
            Start-Sleep -Seconds 5
        }
    }
    $attempt++
}

Write-Host "`n📋 Access Information:" -ForegroundColor Yellow
Write-Host "Primary URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Health Check: http://localhost:5000/api/health" -ForegroundColor Cyan

Write-Host "`n🛠️ If still not working, try:" -ForegroundColor Yellow
Write-Host "1. docker logs creator-ai-app -f" -ForegroundColor White
Write-Host "2. docker restart creator-ai-app" -ForegroundColor White
Write-Host "3. Check Windows Firewall settings" -ForegroundColor White