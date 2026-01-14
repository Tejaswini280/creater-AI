# Quick Start Local Application
Write-Host "🚀 STARTING LOCAL APPLICATION" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check if PostgreSQL is running
Write-Host "`n🔍 Checking PostgreSQL..." -ForegroundColor Yellow
$pgStatus = Get-Process postgres -ErrorAction SilentlyContinue
if ($pgStatus) {
    Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL not running. Please start PostgreSQL first." -ForegroundColor Red
    Write-Host "You can start it with: net start postgresql-x64-15" -ForegroundColor Yellow
    exit 1
}

# Set environment variables
Write-Host "`n🌍 Setting environment variables..." -ForegroundColor Yellow
$env:NODE_ENV = "development"
$env:PORT = "5000"
$env:SKIP_RATE_LIMIT = "1"

# Start the application
Write-Host "`n🚀 Starting application..." -ForegroundColor Yellow
Write-Host "Access your application at: http://localhost:5000" -ForegroundColor Green

npm run dev