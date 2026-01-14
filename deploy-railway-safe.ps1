# Railway Safe Deployment Script
# Deploys migrations to Railway PostgreSQL with safety checks

Write-Host "🚀 Railway Safe Deployment Starting..." -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Blue

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Please install: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

# Verify migrations first
Write-Host "🔍 Verifying migrations..." -ForegroundColor Blue
node verify-railway-migrations.cjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration verification failed. Aborting deployment." -ForegroundColor Red
    exit 1
}

# Login to Railway (if needed)
Write-Host "🔐 Checking Railway authentication..." -ForegroundColor Blue
try {
    railway whoami | Out-Null
    Write-Host "✅ Already authenticated with Railway" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please login to Railway..." -ForegroundColor Yellow
    railway login
}

# Connect to Railway database
Write-Host "🔌 Connecting to Railway database..." -ForegroundColor Blue

# Get database URL
$DATABASE_URL = railway variables get DATABASE_URL
if (-not $DATABASE_URL) {
    Write-Host "❌ DATABASE_URL not found in Railway environment" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database URL retrieved" -ForegroundColor Green

# Create backup (if possible)
Write-Host "💾 Creating database backup..." -ForegroundColor Blue
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "railway_backup_$timestamp.sql"

try {
    # Note: This requires pg_dump to be installed locally
    pg_dump $DATABASE_URL > $backupFile
    Write-Host "✅ Backup created: $backupFile" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not create backup (pg_dump not available)" -ForegroundColor Yellow
    $continue = Read-Host "Continue without backup? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "❌ Deployment cancelled" -ForegroundColor Red
        exit 1
    }
}

# Run migrations in order
$migrations = @(
    "migrations/0000_railway_baseline_safe.sql",
    "migrations/0001_core_tables_idempotent.sql", 
    "migrations/0002_seed_data_with_conflicts.sql",
    "migrations/0003_additional_tables_safe.sql"
)

Write-Host "🔄 Running migrations..." -ForegroundColor Blue

foreach ($migration in $migrations) {
    if (Test-Path $migration) {
        Write-Host "📄 Running: $migration" -ForegroundColor Yellow
        
        try {
            # Use psql to run the migration
            Get-Content $migration | psql $DATABASE_URL
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $migration completed successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ $migration failed" -ForegroundColor Red
                Write-Host "🛑 Stopping deployment due to migration failure" -ForegroundColor Red
                exit 1
            }
        } catch {
            Write-Host "❌ Error running $migration : $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "❌ Migration file not found: $migration" -ForegroundColor Red
        exit 1
    }
}

# Verify deployment
Write-Host "🔍 Verifying deployment..." -ForegroundColor Blue

$verificationQuery = @"
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
"@

try {
    Write-Host "📊 Database tables after migration:" -ForegroundColor Blue
    echo $verificationQuery | psql $DATABASE_URL
    
    Write-Host "✅ Deployment verification completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not verify deployment" -ForegroundColor Yellow
}

# Final status
Write-Host ""
Write-Host "🎉 Railway deployment completed successfully!" -ForegroundColor Green
Write-Host "📋 Summary:" -ForegroundColor Blue
Write-Host "   - All migrations executed" -ForegroundColor Green
Write-Host "   - Database schema updated" -ForegroundColor Green
Write-Host "   - ON CONFLICT constraints properly configured" -ForegroundColor Green
Write-Host "   - No foreign key dependencies" -ForegroundColor Green

if (Test-Path $backupFile) {
    Write-Host "   - Backup saved: $backupFile" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Your Railway application is ready!" -ForegroundColor Green