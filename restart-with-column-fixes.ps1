# RESTART APPLICATION WITH COLUMN FIXES
# Applies critical database fixes and restarts the application

Write-Host "🔧 APPLYING CRITICAL DATABASE COLUMN FIXES..." -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Yellow

# Step 1: Apply column fixes
Write-Host "📋 Step 1: Applying critical column fixes..." -ForegroundColor Cyan
node fix-migration-columns-immediate.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Column fixes failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Column fixes applied successfully!" -ForegroundColor Green

# Step 2: Stop any running processes
Write-Host "📋 Step 2: Stopping existing processes..." -ForegroundColor Cyan
try {
    Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Existing processes stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No existing processes to stop" -ForegroundColor Yellow
}

# Step 3: Clear any cache
Write-Host "📋 Step 3: Clearing cache..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
}
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
}
Write-Host "✅ Cache cleared" -ForegroundColor Green

# Step 4: Install dependencies (if needed)
Write-Host "📋 Step 4: Checking dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}
Write-Host "✅ Dependencies ready" -ForegroundColor Green

# Step 5: Build the application
Write-Host "📋 Step 5: Building application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Application built successfully!" -ForegroundColor Green

# Step 6: Start the application
Write-Host "📋 Step 6: Starting application..." -ForegroundColor Cyan
Write-Host "🚀 Starting Creator AI Studio with fixed database..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# Start in production mode
$env:NODE_ENV = "production"
npm start

Write-Host "🎯 Application startup completed!" -ForegroundColor Green