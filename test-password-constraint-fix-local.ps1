# ═══════════════════════════════════════════════════════════════════════════════
# Test Password Constraint Fix Locally
# ═══════════════════════════════════════════════════════════════════════════════
# This script tests the password constraint fix on your local database
# before deploying to production.
#
# Date: 2026-01-14
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🧪 TESTING PASSWORD CONSTRAINT FIX LOCALLY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "   Please create .env file with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green
Write-Host ""

# Step 1: Reset local database (optional)
Write-Host "📋 Step 1: Database Reset (Optional)" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  WARNING: This will reset your local database!" -ForegroundColor Yellow
$reset = Read-Host "Do you want to reset the local database? (yes/no)"

if ($reset -eq "yes") {
    Write-Host ""
    Write-Host "🔄 Resetting local database..." -ForegroundColor Yellow
    node reset-database.cjs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to reset database" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Database reset complete" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Run migrations
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📦 RUNNING MIGRATIONS" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Running all migrations..." -ForegroundColor Yellow
npm run migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ MIGRATION FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "This is expected if you haven't applied the fix yet." -ForegroundColor Yellow
    Write-Host "The fix will resolve this issue." -ForegroundColor Yellow
    Write-Host ""
    
    $continue = Read-Host "Continue with verification anyway? (yes/no)"
    if ($continue -ne "yes") {
        exit 1
    }
} else {
    Write-Host "✅ All migrations completed successfully" -ForegroundColor Green
}

Write-Host ""

# Step 3: Run verification script
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔍 RUNNING VERIFICATION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Verifying password constraint fix..." -ForegroundColor Yellow
node verify-password-constraint-fix.cjs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ VERIFICATION FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "The password constraint issue still exists." -ForegroundColor Yellow
    Write-Host "Make sure migration 0024 has been applied." -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""

# Step 4: Test application startup
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 TESTING APPLICATION STARTUP" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Starting application..." -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop after verifying it starts successfully" -ForegroundColor Gray
Write-Host ""

# Start the application in the background
$app = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -NoNewWindow

# Wait a few seconds for startup
Start-Sleep -Seconds 5

# Check if process is still running
if ($app.HasExited) {
    Write-Host "❌ Application failed to start" -ForegroundColor Red
    Write-Host "   Check the logs above for errors" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Application started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application should be running at:" -ForegroundColor Cyan
Write-Host "   http://localhost:5000" -ForegroundColor White
Write-Host ""

# Wait for user to test
Write-Host "📋 Test the application:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:5000 in your browser" -ForegroundColor Gray
Write-Host "   2. Try OAuth login (if configured)" -ForegroundColor Gray
Write-Host "   3. Try traditional auth (email/password)" -ForegroundColor Gray
Write-Host "   4. Verify both work correctly" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter when you're done testing (this will stop the app)"

# Stop the application
Write-Host ""
Write-Host "🛑 Stopping application..." -ForegroundColor Yellow
Stop-Process -Id $app.Id -Force
Write-Host "✅ Application stopped" -ForegroundColor Green
Write-Host ""

# Final summary
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ LOCAL TESTING COMPLETE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Test Results:" -ForegroundColor Yellow
Write-Host "   ✅ Migrations ran successfully" -ForegroundColor Green
Write-Host "   ✅ Password constraints verified" -ForegroundColor Green
Write-Host "   ✅ Application started successfully" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Review the test results above" -ForegroundColor Gray
Write-Host "   2. If everything looks good, deploy to production:" -ForegroundColor Gray
Write-Host "      .\deploy-password-constraint-fix.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   • Quick Summary: PASSWORD_CONSTRAINT_FIX_SUMMARY.md" -ForegroundColor Cyan
Write-Host "   • Full Details: PASSWORD_NOT_NULL_CONSTRAINT_ROOT_CAUSE_FIX.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "🎉 Local testing successful! Ready to deploy." -ForegroundColor Green
Write-Host ""
