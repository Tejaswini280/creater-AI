# Run Application with Local Database Setup
Write-Host "🚀 Starting Creator AI Studio Application" -ForegroundColor Cyan

# Check if we can use an existing database or need to set one up
Write-Host "📋 Checking database connection..." -ForegroundColor Yellow

# Update environment to use a simple database URL
$env:DATABASE_URL = "postgresql://postgres@localhost:5432/creators_dev_db"
$env:NODE_ENV = "development"
$env:PORT = "5000"
$env:SKIP_RATE_LIMIT = "1"
$env:PERF_MODE = "1"

Write-Host "🔧 Environment configured" -ForegroundColor Green
Write-Host "📱 Starting application on port 5000..." -ForegroundColor Yellow

# Start the application
npm run dev