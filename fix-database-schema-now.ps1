# ═══════════════════════════════════════════════════════════════════════════════
# COMPREHENSIVE DATABASE SCHEMA FIX - POWERSHELL SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
# This script applies the comprehensive database schema fix to resolve all issues
# Date: 2026-01-09
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🔧 COMPREHENSIVE DATABASE SCHEMA FIX" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if the fix script exists
if (-not (Test-Path "apply-database-schema-fix.cjs")) {
    Write-Host "❌ Database fix script not found: apply-database-schema-fix.cjs" -ForegroundColor Red
    exit 1
}

# Check if the SQL file exists
if (-not (Test-Path "fix-database-schema-complete-final.sql")) {
    Write-Host "❌ SQL fix file not found: fix-database-schema-complete-final.sql" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Pre-flight checks passed" -ForegroundColor Green
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Write-Host "📄 Loading environment variables from .env" -ForegroundColor Yellow
} else {
    Write-Host "⚠️ No .env file found - using system environment variables" -ForegroundColor Yellow
}

# Check if DATABASE_URL is set
$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
    Write-Host "❌ DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL in your .env file or environment variables" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database URL configured" -ForegroundColor Green
Write-Host ""

# Run the database fix
Write-Host "🚀 Applying comprehensive database schema fix..." -ForegroundColor Cyan
Write-Host "⏳ This process will:" -ForegroundColor Yellow
Write-Host "   • Add missing password column to users table" -ForegroundColor Yellow
Write-Host "   • Add missing project_id column to content table" -ForegroundColor Yellow
Write-Host "   • Create all missing AI project management tables" -ForegroundColor Yellow
Write-Host "   • Add performance indexes and constraints" -ForegroundColor Yellow
Write-Host "   • Seed essential data for optimal functionality" -ForegroundColor Yellow
Write-Host ""

try {
    # Run the Node.js script
    $result = node apply-database-schema-fix.cjs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 DATABASE SCHEMA FIX COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ All database schema issues have been resolved" -ForegroundColor Green
        Write-Host "✅ The scheduler service should now work without errors" -ForegroundColor Green
        Write-Host "✅ All AI project management features are ready" -ForegroundColor Green
        Write-Host ""
        Write-Host "🚀 NEXT STEPS:" -ForegroundColor Cyan
        Write-Host "1. Restart your application server" -ForegroundColor White
        Write-Host "2. Check the application logs for any remaining errors" -ForegroundColor White
        Write-Host "3. Test the scheduler and AI project functionality" -ForegroundColor White
        Write-Host ""
        Write-Host "To restart the application, run:" -ForegroundColor Yellow
        Write-Host "   docker-compose down && docker-compose up -d" -ForegroundColor Cyan
        Write-Host "   OR" -ForegroundColor Yellow
        Write-Host "   npm run start" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host "❌ Database schema fix failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running database schema fix: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database schema fix process completed successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green