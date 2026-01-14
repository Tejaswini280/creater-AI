# Simple Docker Startup Script
$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

Write-Host "🐳 Starting Creator AI Studio - Development Environment" -ForegroundColor Cyan

# Stop existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
& $dockerPath compose -f docker-compose.dev.yml down

# Start containers
Write-Host "🔨 Building and starting containers..." -ForegroundColor Yellow
& $dockerPath compose -f docker-compose.dev.yml up --build -d

# Show status
Write-Host "📊 Container Status:" -ForegroundColor Cyan
& $dockerPath compose -f docker-compose.dev.yml ps

Write-Host ""
Write-Host "🎉 Development environment started!" -ForegroundColor Green
Write-Host "📱 Application: http://localhost:5000" -ForegroundColor White
Write-Host "🗄️  Database: localhost:5432 (postgres/postgres123)" -ForegroundColor White