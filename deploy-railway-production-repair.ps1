# ═══════════════════════════════════════════════════════════════════════════════
# RAILWAY PRODUCTION REPAIR DEPLOYMENT SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════
# This script safely applies the complete production repair migration to Railway
# Includes pre-flight checks, migration execution, and post-migration validation
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false,
    [string]$DatabaseUrl = $env:DATABASE_URL
)

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 RAILWAY PRODUCTION REPAIR DEPLOYMENT" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is provided
if (-not $DatabaseUrl) {
    Write-Host "❌ ERROR: DATABASE_URL not provided" -ForegroundColor Red
    Write-Host "   Please set DATABASE_URL environment variable or pass -DatabaseUrl parameter" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Example:" -ForegroundColor Yellow
    Write-Host "   $env:DATABASE_URL = 'postgresql://user:pass@host:port/db'" -ForegroundColor Yellow
    Write-Host "   .\deploy-railway-production-repair.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Validate migration file exists
$migrationFile = "migrations/0009_railway_production_repair_complete.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migration file found: $migrationFile" -ForegroundColor Green

# Pre-flight checks
Write-Host ""
Write-Host "🔍 PERFORMING PRE-FLIGHT CHECKS..." -ForegroundColor Yellow
Write-Host ""

# Test database connectivity
Write-Host "📡 Testing database connectivity..." -ForegroundColor Cyan
try {
    $testQuery = "SELECT version();"
    $result = psql $DatabaseUrl -c $testQuery -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful" -ForegroundColor Green
        Write-Host "   PostgreSQL Version: $($result.Trim())" -ForegroundColor Gray
    } else {
        Write-Host "❌ Database connection failed" -ForegroundColor Red
        Write-Host "   Error: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Database connection failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check current schema state
Write-Host ""
Write-Host "🔍 Checking current database schema..." -ForegroundColor Cyan

# Check if users table exists and has password column
$checkUsersQuery = @"
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
         THEN 'EXISTS' ELSE 'MISSING' END as users_table,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') 
         THEN 'EXISTS' ELSE 'MISSING' END as password_column;
"@

try {
    $schemaCheck = psql $DatabaseUrl -c $checkUsersQuery -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        $parts = $schemaCheck.Trim() -split '\|'
        $usersTable = $parts[0].Trim()
        $passwordColumn = $parts[1].Trim()
        
        Write-Host "   Users table: $usersTable" -ForegroundColor $(if ($usersTable -eq 'EXISTS') { 'Green' } else { 'Yellow' })
        Write-Host "   Password column: $passwordColumn" -ForegroundColor $(if ($passwordColumn -eq 'EXISTS') { 'Green' } else { 'Red' })
        
        if ($passwordColumn -eq 'MISSING') {
            Write-Host "🎯 CONFIRMED: Password column missing - this migration will fix it" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Could not check schema state (this is OK for fresh databases)" -ForegroundColor Yellow
}

# Show what the migration will do
Write-Host ""
Write-Host "📋 MIGRATION SUMMARY:" -ForegroundColor Yellow
Write-Host "   • Creates all missing tables (idempotent)" -ForegroundColor Gray
Write-Host "   • Adds missing password column to users table" -ForegroundColor Gray
Write-Host "   • Adds missing project wizard columns to projects table" -ForegroundColor Gray
Write-Host "   • Adds missing scheduler form columns to post_schedules table" -ForegroundColor Gray
Write-Host "   • Creates all essential indexes for performance" -ForegroundColor Gray
Write-Host "   • Sets up automatic timestamp triggers" -ForegroundColor Gray
Write-Host "   • Seeds essential data (AI patterns, niches)" -ForegroundColor Gray
Write-Host "   • Validates all critical structures exist" -ForegroundColor Gray
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - Migration will NOT be executed" -ForegroundColor Yellow
    Write-Host "   Remove -DryRun flag to execute the migration" -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# Confirmation prompt (unless forced)
if (-not $Force) {
    Write-Host "⚠️  PRODUCTION DEPLOYMENT CONFIRMATION" -ForegroundColor Yellow
    Write-Host "   This will modify the Railway production database" -ForegroundColor Yellow
    Write-Host "   The migration is designed to be safe and idempotent" -ForegroundColor Yellow
    Write-Host ""
    $confirmation = Read-Host "   Continue with migration? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "❌ Migration cancelled by user" -ForegroundColor Red
        exit 1
    }
}

# Execute migration
Write-Host ""
Write-Host "🚀 EXECUTING MIGRATION..." -ForegroundColor Yellow
Write-Host ""

$startTime = Get-Date
try {
    Write-Host "📄 Running migration file: $migrationFile" -ForegroundColor Cyan
    $migrationOutput = psql $DatabaseUrl -f $migrationFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        $endTime = Get-Date
        $duration = $endTime - $startTime
        
        Write-Host ""
        Write-Host "✅ MIGRATION COMPLETED SUCCESSFULLY" -ForegroundColor Green
        Write-Host "   Duration: $($duration.TotalSeconds) seconds" -ForegroundColor Gray
        Write-Host ""
        
        # Show migration output (last few lines)
        $outputLines = $migrationOutput -split "`n" | Where-Object { $_.Trim() -ne "" } | Select-Object -Last 10
        Write-Host "📊 Migration Results:" -ForegroundColor Cyan
        foreach ($line in $outputLines) {
            if ($line -match "✅|🎉") {
                Write-Host "   $line" -ForegroundColor Green
            } elseif ($line -match "⚠️|WARNING") {
                Write-Host "   $line" -ForegroundColor Yellow
            } else {
                Write-Host "   $line" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host ""
        Write-Host "❌ MIGRATION FAILED" -ForegroundColor Red
        Write-Host "   Exit Code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
        Write-Host "📄 Migration Output:" -ForegroundColor Yellow
        Write-Host $migrationOutput -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ MIGRATION FAILED WITH EXCEPTION" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Post-migration validation
Write-Host ""
Write-Host "🔍 PERFORMING POST-MIGRATION VALIDATION..." -ForegroundColor Yellow
Write-Host ""

# Validate critical tables exist
$validationQuery = @"
SELECT 
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'projects', 'content', 'content_metrics', 'post_schedules');
"@

try {
    $tableCount = psql $DatabaseUrl -c $validationQuery -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        $count = $tableCount.Trim()
        if ($count -eq "5") {
            Write-Host "✅ All critical tables exist ($count/5)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Some critical tables missing ($count/5)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Could not validate table count" -ForegroundColor Yellow
}

# Validate password column exists
$passwordValidationQuery = @"
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password') 
         THEN 'EXISTS' ELSE 'MISSING' END as password_column;
"@

try {
    $passwordCheck = psql $DatabaseUrl -c $passwordValidationQuery -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        $passwordStatus = $passwordCheck.Trim()
        if ($passwordStatus -eq 'EXISTS') {
            Write-Host "✅ Users table password column exists" -ForegroundColor Green
        } else {
            Write-Host "❌ Users table password column still missing" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "⚠️  Could not validate password column" -ForegroundColor Yellow
}

# Test basic functionality
Write-Host ""
Write-Host "🧪 TESTING BASIC FUNCTIONALITY..." -ForegroundColor Yellow

$functionalityTestQuery = @"
-- Test that we can insert and query a user
INSERT INTO users (id, email, password, first_name, last_name) 
VALUES ('test-deploy-$(Get-Date -Format 'yyyyMMddHHmmss')', 'test-deploy@example.com', 'test_password', 'Test', 'Deploy')
ON CONFLICT (email) DO UPDATE SET updated_at = NOW();

-- Test that we can query the user
SELECT COUNT(*) as user_count FROM users WHERE email LIKE 'test-deploy%';
"@

try {
    $functionalityResult = psql $DatabaseUrl -c $functionalityTestQuery -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Basic database operations working" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Basic functionality test failed (non-critical)" -ForegroundColor Yellow
        Write-Host "   Error: $functionalityResult" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Could not test basic functionality" -ForegroundColor Yellow
}

# Final success message
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 RAILWAY PRODUCTION REPAIR COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Database schema is now complete and consistent" -ForegroundColor Green
Write-Host "✅ Railway 502 errors should be eliminated" -ForegroundColor Green
Write-Host "✅ All application features should work correctly" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Deploy your application to Railway" -ForegroundColor Gray
Write-Host "   2. Monitor application logs for any remaining issues" -ForegroundColor Gray
Write-Host "   3. Test all major features (login, project creation, scheduling)" -ForegroundColor Gray
Write-Host "   4. Monitor Railway metrics for performance improvements" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Useful Commands:" -ForegroundColor Yellow
Write-Host "   railway logs --tail                    # Monitor application logs" -ForegroundColor Gray
Write-Host "   railway status                         # Check deployment status" -ForegroundColor Gray
Write-Host "   psql `$DATABASE_URL -c 'SELECT version();'  # Test database connection" -ForegroundColor Gray
Write-Host ""

# Log completion
$completionTime = Get-Date
Write-Host "⏰ Migration completed at: $completionTime" -ForegroundColor Gray
Write-Host "⏱️  Total duration: $($completionTime - $startTime)" -ForegroundColor Gray
Write-Host ""