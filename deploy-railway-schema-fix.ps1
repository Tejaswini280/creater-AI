# Railway Database Schema Fix and Deployment Script
Write-Host "🚀 Starting Railway database schema fix and deployment..." -ForegroundColor Green

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Login check
Write-Host "🔐 Checking Railway authentication..." -ForegroundColor Blue
$loginCheck = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Railway. Please run: railway login" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Authenticated as: $loginCheck" -ForegroundColor Green

# Set the project context
Write-Host "🎯 Setting Railway project context..." -ForegroundColor Blue
railway link

# Run the database schema fix
Write-Host "🔧 Running database schema fix..." -ForegroundColor Blue
railway run node fix-railway-database-schema.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database schema fix failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database schema fix completed successfully!" -ForegroundColor Green

# Deploy the latest code
Write-Host "🚀 Deploying to Railway..." -ForegroundColor Blue
railway up --detach

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Railway deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Railway deployment initiated successfully!" -ForegroundColor Green

# Wait a moment for deployment to start
Start-Sleep -Seconds 5

# Check deployment status
Write-Host "📊 Checking deployment status..." -ForegroundColor Blue
railway status

Write-Host "🎉 Railway database schema fix and deployment completed!" -ForegroundColor Green
Write-Host "🌐 Your application should be available at your Railway URL shortly." -ForegroundColor Cyan
Write-Host "📝 Check the Railway dashboard for deployment logs and status." -ForegroundColor Yellow