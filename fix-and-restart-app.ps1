# ═══════════════════════════════════════════════════════════════════════════════
# COMPLETE DATABASE FIX AND APPLICATION RESTART SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
# This script fixes the root cause of the migration errors and restarts the app
# Addresses: "column project_id does not exist" and "column password does not exist"
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🔧 COMPLETE DATABASE FIX AND APPLICATION RESTART" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "This will fix the database schema issues and restart your application" -ForegroundColor Yellow
Write-Host ""

# Step 1: Apply the root cause database fix
Write-Host "📋 STEP 1: Applying root cause database schema fix..." -ForegroundColor Green
try {
    node apply-root-cause-fix.cjs
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database schema fix applied successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Database schema fix failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error applying database fix: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Clear any cached data
Write-Host "📋 STEP 2: Clearing application cache..." -ForegroundColor Green
try {
    if (Test-Path "node_modules/.cache") {
        Remove-Item -Recurse -Force "node_modules/.cache"
        Write-Host "✅ Node modules cache cleared" -ForegroundColor Green
    }
    
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Host "✅ Dist folder cleared" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Cache clearing had issues (non-critical): $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Install dependencies (ensure everything is up to date)
Write-Host "📋 STEP 3: Installing/updating dependencies..." -ForegroundColor Green
try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Dependency installation failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error installing dependencies: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Build the application
Write-Host "📋 STEP 4: Building application..." -ForegroundColor Green
try {
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Application built successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Application build failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error building application: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Start the application
Write-Host "📋 STEP 5: Starting application..." -ForegroundColor Green
Write-Host "🚀 Your application should now start without migration errors!" -ForegroundColor Cyan
Write-Host ""

try {
    npm start
} catch {
    Write-Host "❌ Error starting application: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 If the application still fails to start, check the logs above for any remaining issues." -ForegroundColor Yellow
    Write-Host "The database schema has been fixed, so migration errors should be resolved." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 APPLICATION STARTUP COMPLETE!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green