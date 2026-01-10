# ═══════════════════════════════════════════════════════════════════════════════
# START APPLICATION IN DEVELOPMENT MODE
# ═══════════════════════════════════════════════════════════════════════════════
# This script starts your application in development mode with proper database setup
# This will fix your 502 error by using the correct environment
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 STARTING APPLICATION IN DEVELOPMENT MODE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "This will start your app in development mode to fix the 502 error" -ForegroundColor Yellow
Write-Host ""

# Step 1: Set environment to development
Write-Host "🔧 Step 1: Setting environment to development..." -ForegroundColor Green
$env:NODE_ENV = "development"
Write-Host "✅ NODE_ENV set to development" -ForegroundColor Green

# Step 2: Start Docker database if available
Write-Host "🔧 Step 2: Checking for Docker database..." -ForegroundColor Green
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is available" -ForegroundColor Green
    
    # Check if docker-compose file exists
    if (Test-Path "docker-compose.yml") {
        Write-Host "🔧 Starting Docker database..." -ForegroundColor Green
        docker-compose up -d db
        Start-Sleep -Seconds 5
        Write-Host "✅ Docker database started" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No docker-compose.yml found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Docker not available, will try without local database" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Step 3: Starting application in development mode..." -ForegroundColor Green

# Start the application in development mode
try {
    npm run dev
} catch {
    Write-Host "❌ Development mode failed, trying production with development env..." -ForegroundColor Red
    try {
        npm start
    } catch {
        Write-Host "❌ Application failed to start" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔍 Try these alternatives:" -ForegroundColor Yellow
        Write-Host "1. Install PostgreSQL locally" -ForegroundColor Yellow
        Write-Host "2. Use Railway database: .\start-with-railway-db.ps1" -ForegroundColor Yellow
        Write-Host "3. Start Docker database: docker-compose up -d" -ForegroundColor Yellow
        exit 1
    }
}