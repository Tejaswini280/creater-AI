# Railway Deployment Script with Database Setup (PowerShell)
# This script sets up the database and deploys the application

Write-Host "🚀 Starting Railway deployment with database setup..." -ForegroundColor Green

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL environment variable is required" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

Write-Host "🏗️ Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host "🗄️ Setting up database schema..." -ForegroundColor Yellow
node railway-database-setup.cjs

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database setup completed successfully" -ForegroundColor Green
    Write-Host "🚀 Starting application..." -ForegroundColor Green
    npm start
} else {
    Write-Host "❌ Database setup failed" -ForegroundColor Red
    exit 1
}