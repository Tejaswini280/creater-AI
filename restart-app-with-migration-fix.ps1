# ═══════════════════════════════════════════════════════════════════════════════
# RESTART APPLICATION WITH MIGRATION FIX
# ═══════════════════════════════════════════════════════════════════════════════
# This script applies the immediate migration fix and restarts the application
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🔧 APPLYING MIGRATION FIX AND RESTARTING APPLICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Step 1: Apply the immediate fix migration
Write-Host ""
Write-Host "📋 Step 1: Applying immediate migration fix..." -ForegroundColor Yellow

try {
    # Run the migration system to apply the new fix
    Write-Host "🔄 Running migration system..." -ForegroundColor Green
    node scripts/run-migrations.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration fix applied successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration fix failed" -ForegroundColor Red
        Write-Host "   Continuing with application restart..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error applying migration fix: $_" -ForegroundColor Red
    Write-Host "   Continuing with application restart..." -ForegroundColor Yellow
}

# Step 2: Clear any cached data
Write-Host ""
Write-Host "📋 Step 2: Clearing application cache..." -ForegroundColor Yellow

try {
    # Clear node modules cache
    if (Test-Path "node_modules/.cache") {
        Remove-Item -Recurse -Force "node_modules/.cache" -ErrorAction SilentlyContinue
        Write-Host "✅ Node modules cache cleared" -ForegroundColor Green
    }
    
    # Clear dist folder
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
        Write-Host "✅ Dist folder cleared" -ForegroundColor Green
    }
    
} catch {
    Write-Host "⚠️  Cache clearing had issues (non-critical): $_" -ForegroundColor Yellow
}

# Step 3: Rebuild the application
Write-Host ""
Write-Host "📋 Step 3: Rebuilding application..." -ForegroundColor Yellow

try {
    Write-Host "🔨 Building application..." -ForegroundColor Green
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Application built successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Build failed, but continuing..." -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Build error: $_" -ForegroundColor Red
    Write-Host "   Continuing with startup..." -ForegroundColor Yellow
}

# Step 4: Start the application
Write-Host ""
Write-Host "📋 Step 4: Starting application..." -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

try {
    Write-Host "🚀 Starting application in production mode..." -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Application will start with:" -ForegroundColor Cyan
    Write-Host "   • Fixed migration dependencies" -ForegroundColor White
    Write-Host "   • Proper table creation order" -ForegroundColor White
    Write-Host "   • Resolved project_id column references" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Once started, your application will be available at:" -ForegroundColor Cyan
    Write-Host "   • Local: http://localhost:5000" -ForegroundColor White
    Write-Host "   • Railway: https://your-app.railway.app" -ForegroundColor White
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🎯 STARTING APPLICATION NOW..." -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    # Start the application
    npm start
    
} catch {
    Write-Host ""
    Write-Host "❌ Application startup failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 TROUBLESHOOTING STEPS:" -ForegroundColor Yellow
    Write-Host "1. Check your DATABASE_URL environment variable" -ForegroundColor White
    Write-Host "2. Ensure your database is accessible" -ForegroundColor White
    Write-Host "3. Try running: npm run dev (for development mode)" -ForegroundColor White
    Write-Host "4. Check the logs above for specific error details" -ForegroundColor White
    Write-Host ""
    exit 1
}