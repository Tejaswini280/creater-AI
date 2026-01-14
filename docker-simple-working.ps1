# Simple Working Docker Setup
$dockerPath = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"

Write-Host "🐳 Creating Simple Working Docker Setup" -ForegroundColor Cyan

# Stop the current application
Write-Host "🛑 Stopping current application..." -ForegroundColor Yellow
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
} catch {}

# Create a development Docker container that mirrors your working setup
Write-Host "🔨 Building development Docker image..." -ForegroundColor Yellow
& $dockerPath build -t creator-ai-dev -f Dockerfile.dev .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Docker image built successfully" -ForegroundColor Green
    
    # Run the container with volume mounting for live development
    Write-Host "🚀 Starting development container..." -ForegroundColor Yellow
    & $dockerPath run -d `
      --name creator-ai-dev `
      -p 5000:5000 `
      -v "${PWD}:/app" `
      -v "/app/node_modules" `
      -e NODE_ENV=development `
      -e PORT=5000 `
      -e DATABASE_URL="postgresql://postgres@host.docker.internal:5432/creators_dev_db" `
      -e SKIP_RATE_LIMIT=1 `
      -e PERF_MODE=1 `
      creator-ai-dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Container started successfully!" -ForegroundColor Green
        Write-Host "📱 Application will be available at: http://localhost:5000" -ForegroundColor White
        Write-Host "⏳ Waiting for application to start..." -ForegroundColor Yellow
        
        # Wait and test
        Start-Sleep 15
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 10 -UseBasicParsing
            Write-Host "🎉 SUCCESS! Application is accessible at http://localhost:5000" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Application is starting up. Try accessing http://localhost:5000 in a few moments." -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "📋 Container Management:" -ForegroundColor Cyan
        Write-Host "   View logs: docker logs -f creator-ai-dev" -ForegroundColor White
        Write-Host "   Stop: docker stop creator-ai-dev" -ForegroundColor White
        Write-Host "   Shell: docker exec -it creator-ai-dev sh" -ForegroundColor White
        
    } else {
        Write-Host "❌ Failed to start container" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
}