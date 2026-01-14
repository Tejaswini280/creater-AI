# Complete Railway Deployment with Database Schema Fix
# This script fixes the database schema issues and deploys to Railway

Write-Host "🚀 Starting Railway deployment with database schema fix..." -ForegroundColor Green

# Step 1: Run the database schema fix
Write-Host "🔧 Fixing database schema..." -ForegroundColor Yellow
node fix-railway-database-schema-complete.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database schema fix failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database schema fixed successfully!" -ForegroundColor Green

# Step 2: Build the application
Write-Host "🏗️ Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Step 3: Deploy to Railway
Write-Host "🚂 Deploying to Railway..." -ForegroundColor Yellow

# Check if railway CLI is available
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
}

# Deploy to Railway
railway up

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Your application should now be accessible at your Railway URL" -ForegroundColor Cyan

# Step 4: Verify deployment
Write-Host "🔍 Verifying deployment..." -ForegroundColor Yellow

# Get Railway URL
$railwayUrl = railway status --json | ConvertFrom-Json | Select-Object -ExpandProperty url

if ($railwayUrl) {
    Write-Host "✅ Application URL: $railwayUrl" -ForegroundColor Green
    Write-Host "🔗 Health check: $railwayUrl/api/health" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Could not retrieve Railway URL. Check Railway dashboard." -ForegroundColor Yellow
}

Write-Host "🎯 Deployment process completed!" -ForegroundColor Green