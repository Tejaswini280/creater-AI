#!/usr/bin/env pwsh

# ═══════════════════════════════════════════════════════════════════════════════
# RUN APPLICATION WITH MIGRATION FIX
# ═══════════════════════════════════════════════════════════════════════════════
# This script runs the application locally with the fixed migration system
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 STARTING APPLICATION WITH MIGRATION FIX..." -ForegroundColor Green
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: Verify migration fix
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ STEP 1: Verifying migration fix..." -ForegroundColor Yellow
node verify-migration-fix.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration verification failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: Install dependencies
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ STEP 2: Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: Check PostgreSQL connection
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ STEP 3: Checking PostgreSQL connection..." -ForegroundColor Yellow

# Try to connect to PostgreSQL
$pgCheck = psql --version 2>$null
if (-not $pgCheck) {
    Write-Host "⚠️  PostgreSQL client not found. Checking if server is running..." -ForegroundColor Yellow
    
    # Check if PostgreSQL service is running (Windows)
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if (-not $pgService -or $pgService.Status -ne "Running") {
        Write-Host "❌ PostgreSQL is not running!" -ForegroundColor Red
        Write-Host "   Please start PostgreSQL service or install PostgreSQL" -ForegroundColor Red
        Write-Host "   Alternative: Use Docker PostgreSQL:" -ForegroundColor Yellow
        Write-Host "   docker run --name postgres-dev -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15" -ForegroundColor Gray
        exit 1
    }
} else {
    Write-Host "   ✅ PostgreSQL client found: $pgCheck" -ForegroundColor Green
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4: Setup database with fixed migrations
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ STEP 4: Setting up database with fixed migrations..." -ForegroundColor Yellow

# Create database if it doesn't exist
Write-Host "   📊 Creating database if needed..."
$createDbResult = psql -h localhost -U postgres -c "CREATE DATABASE creators_dev_db;" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database created successfully" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Database already exists or connection issue" -ForegroundColor Gray
}

# Run migrations with the fixed system
Write-Host "   🔄 Running fixed migrations..."
npm run db:migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database migration failed!" -ForegroundColor Red
    Write-Host "   This might be due to PostgreSQL connection issues." -ForegroundColor Red
    Write-Host "   Please check your PostgreSQL setup and .env configuration." -ForegroundColor Red
    exit 1
}

# Seed database
Write-Host "   🌱 Seeding database..."
npm run db:seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Database seeding failed, but continuing..." -ForegroundColor Yellow
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5: Build client
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ STEP 5: Building client..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Client build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6: Start application
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "✅ STEP 6: Starting application..." -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 APPLICATION STARTING WITH MIGRATION FIX!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application will be available at: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🔧 Migration system: FIXED and production-ready" -ForegroundColor Green
Write-Host "📊 Database: PostgreSQL with repaired schema" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the application" -ForegroundColor Gray
Write-Host ""

# Start the development server
npm run dev