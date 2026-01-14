# Complete Railway Deployment Fix
# This script addresses all the issues preventing your Railway deployment from working

Write-Host "🚀 Starting complete Railway deployment fix..." -ForegroundColor Green

# Step 1: Clean and rebuild
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Cleaned dist directory" -ForegroundColor Green
}

if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
    Write-Host "✅ Cleaned Vite cache" -ForegroundColor Green
}

# Step 2: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm ci

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Dependency installation failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Build the application
Write-Host "🏗️ Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Step 4: Verify build output
Write-Host "🔍 Verifying build output..." -ForegroundColor Yellow
node fix-static-file-serving.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build verification failed!" -ForegroundColor Red
    exit 1
}

# Step 5: Fix database schema
Write-Host "🔧 Fixing database schema..." -ForegroundColor Yellow
node fix-railway-database-schema-complete.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database schema fix failed!" -ForegroundColor Red
    Write-Host "⚠️ Continuing with deployment - schema will be fixed on Railway..." -ForegroundColor Yellow
}

# Step 6: Deploy to Railway
Write-Host "🚂 Deploying to Railway..." -ForegroundColor Yellow

# Check if railway CLI is available
if (!(Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "📥 Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Deploy to Railway
railway up --detach

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Deployment initiated successfully!" -ForegroundColor Green

# Step 7: Wait for deployment and get URL
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Get Railway service info
$serviceInfo = railway status --json 2>$null | ConvertFrom-Json

if ($serviceInfo -and $serviceInfo.url) {
    $railwayUrl = $serviceInfo.url
    Write-Host "🌐 Application URL: $railwayUrl" -ForegroundColor Green
    
    # Step 8: Fix database schema on Railway
    Write-Host "🔧 Fixing database schema on Railway..." -ForegroundColor Yellow
    
    # Set Railway environment for the schema fix
    $env:DATABASE_URL = railway variables get DATABASE_URL 2>$null
    
    if ($env:DATABASE_URL) {
        node fix-railway-database-schema-complete.cjs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database schema fixed on Railway!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Database schema fix may have failed - check Railway logs" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Could not get Railway database URL for schema fix" -ForegroundColor Yellow
    }
    
    # Step 9: Test the deployment
    Write-Host "🧪 Testing deployment..." -ForegroundColor Yellow
    
    try {
        $healthResponse = Invoke-RestMethod -Uri "$railwayUrl/api/health" -TimeoutSec 30
        if ($healthResponse.status -eq "ok") {
            Write-Host "✅ Health check passed!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Health check returned unexpected status" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Health check failed - deployment may still be starting" -ForegroundColor Yellow
    }
    
    # Test frontend
    try {
        $frontendResponse = Invoke-WebRequest -Uri $railwayUrl -TimeoutSec 30
        if ($frontendResponse.StatusCode -eq 200 -and $frontendResponse.Content.Contains("<!DOCTYPE html>")) {
            Write-Host "✅ Frontend is serving correctly!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Frontend may not be serving correctly" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Frontend test failed - deployment may still be starting" -ForegroundColor Yellow
    }
    
    Write-Host "🎉 Deployment completed!" -ForegroundColor Green
    Write-Host "🔗 Your application: $railwayUrl" -ForegroundColor Cyan
    Write-Host "🔗 Health check: $railwayUrl/api/health" -ForegroundColor Cyan
    Write-Host "🔗 API status: $railwayUrl/api/status" -ForegroundColor Cyan
    
} else {
    Write-Host "⚠️ Could not retrieve Railway URL. Check Railway dashboard." -ForegroundColor Yellow
    Write-Host "🔗 Railway Dashboard: https://railway.app/dashboard" -ForegroundColor Cyan
}

Write-Host "📋 Next steps if issues persist:" -ForegroundColor Yellow
Write-Host "1. Check Railway logs: railway logs" -ForegroundColor White
Write-Host "2. Check Railway dashboard for deployment status" -ForegroundColor White
Write-Host "3. Verify environment variables are set correctly" -ForegroundColor White
Write-Host "4. Run database schema fix manually if needed" -ForegroundColor White

Write-Host "🎯 Deployment process completed!" -ForegroundColor Green