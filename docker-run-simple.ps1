# Simple Docker Run Script
$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

Write-Host "🐳 Starting Creator AI Studio with Docker" -ForegroundColor Cyan

# First, let's try to run just a PostgreSQL container
Write-Host "🗄️  Starting PostgreSQL database..." -ForegroundColor Yellow
& $dockerPath run -d `
  --name creator-ai-postgres `
  -e POSTGRES_DB=creators_dev_db `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres123 `
  -p 5432:5432 `
  postgres:15-alpine

# Wait a moment for database to start
Write-Host "⏳ Waiting for database to start..." -ForegroundColor Yellow
Start-Sleep 5

# Check if database is running
$dbStatus = & $dockerPath ps --filter "name=creator-ai-postgres" --format "{{.Status}}"
if ($dbStatus -like "*Up*") {
    Write-Host "✅ Database is running!" -ForegroundColor Green
} else {
    Write-Host "❌ Database failed to start" -ForegroundColor Red
    & $dockerPath logs creator-ai-postgres
    exit 1
}

# Now build and run the application container
Write-Host "🔨 Building application container..." -ForegroundColor Yellow
& $dockerPath build -t creator-ai-app -f Dockerfile.dev .

Write-Host "🚀 Starting application container..." -ForegroundColor Yellow
& $dockerPath run -d `
  --name creator-ai-app `
  --link creator-ai-postgres:postgres `
  -e DATABASE_URL="postgresql://postgres:postgres123@postgres:5432/creators_dev_db" `
  -e NODE_ENV=development `
  -e PORT=5000 `
  -e SKIP_RATE_LIMIT=1 `
  -e PERF_MODE=1 `
  -p 5000:5000 `
  -v "${PWD}:/app" `
  creator-ai-app

Write-Host ""
Write-Host "📊 Container Status:" -ForegroundColor Cyan
& $dockerPath ps

Write-Host ""
Write-Host "🎉 Containers started!" -ForegroundColor Green
Write-Host "📱 Application: http://localhost:5000" -ForegroundColor White
Write-Host "🗄️  Database: localhost:5432 (postgres/postgres123)" -ForegroundColor White