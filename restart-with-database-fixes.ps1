# RESTART APPLICATION WITH DATABASE FIXES
# Applies critical database fixes and restarts the application

Write-Host "🔧 APPLYING RAILWAY DATABASE FIXES..." -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow

# Step 1: Apply database fixes
Write-Host "📋 Step 1: Applying Railway database fixes..." -ForegroundColor Cyan
node fix-railway-database-columns.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database fixes failed! Continuing with restart..." -ForegroundColor Yellow
}

Write-Host "✅ Database fixes completed!" -ForegroundColor Green

# Step 2: Stop any running processes
Write-Host "📋 Step 2: Stopping existing processes..." -ForegroundColor Cyan
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Existing processes stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No existing processes to stop" -ForegroundColor Yellow
}

# Step 3: Clear cache
Write-Host "📋 Step 3: Clearing cache..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
Write-Host "✅ Cache cleared" -ForegroundColor Green

# Step 4: Build the application
Write-Host "📋 Step 4: Building application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Trying to start anyway..." -ForegroundColor Yellow
}

Write-Host "✅ Application built!" -ForegroundColor Green

# Step 5: Start the application
Write-Host "📋 Step 5: Starting application..." -ForegroundColor Cyan
Write-Host "🚀 Starting Creator AI Studio with fixed database..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# Set production environment
$env:NODE_ENV = "production"

# Start the application
npm start

Write-Host "🎯 Application startup completed!" -ForegroundColor Green