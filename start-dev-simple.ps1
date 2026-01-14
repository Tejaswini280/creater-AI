# Simple Development Startup Script
# This bypasses migration issues and starts the app in development mode

Write-Host "🚀 Starting CreatorNexus in development mode..." -ForegroundColor Green

# Set development environment
$env:NODE_ENV = "development"
$env:PORT = "5000"
$env:SKIP_RATE_LIMIT = "1"

# Use a simple in-memory or file-based approach for development
$env:DATABASE_URL = "sqlite://./dev.db"

Write-Host "🌍 Environment: $env:NODE_ENV" -ForegroundColor Cyan
Write-Host "🔌 Database: SQLite (development)" -ForegroundColor Cyan
Write-Host "🚀 Port: $env:PORT" -ForegroundColor Cyan

# Start the development server
npm run dev