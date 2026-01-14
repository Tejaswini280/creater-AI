# Docker Fix and Run Script
$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

Write-Host "🐳 Creator AI Studio - Docker Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Try to fix Docker credential issue
Write-Host "🔧 Attempting to fix Docker credentials..." -ForegroundColor Yellow

# Set Docker config to not use credential store
$env:DOCKER_CONFIG = $PWD
$configContent = @"
{
  "auths": {},
  "credsStore": ""
}
"@

$configContent | Out-File -FilePath "config.json" -Encoding UTF8

Write-Host "📋 Trying to pull PostgreSQL image..." -ForegroundColor Yellow
$pullResult = & $dockerPath pull postgres:15-alpine 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Successfully pulled PostgreSQL image" -ForegroundColor Green
    
    # Start PostgreSQL container
    Write-Host "🗄️  Starting PostgreSQL container..." -ForegroundColor Yellow
    & $dockerPath run -d --name creator-ai-postgres -e POSTGRES_DB=creators_dev_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres123 -p 5432:5432 postgres:15-alpine
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL container started successfully" -ForegroundColor Green
        
        # Wait for database to be ready
        Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
        Start-Sleep 10
        
        # Show container status
        Write-Host "📊 Container Status:" -ForegroundColor Cyan
        & $dockerPath ps
        
        Write-Host ""
        Write-Host "🎉 Database container is running!" -ForegroundColor Green
        Write-Host "🗄️  Database: localhost:5432 (postgres/postgres123)" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Now you can run your application with:" -ForegroundColor Yellow
        Write-Host "   npm run dev" -ForegroundColor White
        
    } else {
        Write-Host "❌ Failed to start PostgreSQL container" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Failed to pull PostgreSQL image. Error:" -ForegroundColor Red
    Write-Host $pullResult -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Your application is already working without Docker!" -ForegroundColor Yellow
    Write-Host "   You can continue using: npm run dev" -ForegroundColor White
}

# Clean up config file
Remove-Item "config.json" -ErrorAction SilentlyContinue