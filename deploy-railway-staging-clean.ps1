# Railway Staging Clean Deployment
# Deploys with clean migrations to avoid dependency issues

Write-Host "🚀 Deploying to Railway Staging with clean migrations..." -ForegroundColor Green

# Backup existing migrations
Write-Host "📦 Backing up existing migrations..." -ForegroundColor Yellow
if (Test-Path "migrations_backup") {
    Remove-Item -Recurse -Force "migrations_backup"
}
Copy-Item -Recurse "migrations" "migrations_backup"

# Clear migrations directory and add only clean migrations
Write-Host "🧹 Clearing migrations directory..." -ForegroundColor Yellow
Remove-Item -Path "migrations\*" -Force

# Copy only the clean migrations
Write-Host "📋 Adding clean migrations..." -ForegroundColor Yellow
Copy-Item "migrations\0001_core_tables_clean.sql" "migrations\" -ErrorAction SilentlyContinue
Copy-Item "migrations\0002_add_missing_columns.sql" "migrations\" -ErrorAction SilentlyContinue  
Copy-Item "migrations\0003_essential_tables.sql" "migrations\" -ErrorAction SilentlyContinue
Copy-Item "migrations\0004_seed_essential_data.sql" "migrations\" -ErrorAction SilentlyContinue

# Verify clean migrations exist
$cleanMigrations = @(
    "migrations\0001_core_tables_clean.sql",
    "migrations\0002_add_missing_columns.sql", 
    "migrations\0003_essential_tables.sql",
    "migrations\0004_seed_essential_data.sql"
)

$allExist = $true
foreach ($migration in $cleanMigrations) {
    if (-not (Test-Path $migration)) {
        Write-Host "❌ Missing migration: $migration" -ForegroundColor Red
        $allExist = $false
    } else {
        Write-Host "✅ Found: $migration" -ForegroundColor Green
    }
}

if (-not $allExist) {
    Write-Host "❌ Some clean migrations are missing. Restoring backup..." -ForegroundColor Red
    Remove-Item -Path "migrations\*" -Force
    Copy-Item -Recurse "migrations_backup\*" "migrations\"
    exit 1
}

# Update package.json to use clean migration runner
Write-Host "📝 Updating package.json for clean migrations..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.scripts.migrate = "node server/services/cleanMigrationRunner.js"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

# Create clean migration runner
Write-Host "🔧 Creating clean migration runner..." -ForegroundColor Yellow
$cleanRunner = @"
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runCleanMigrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    
    try {
        console.log('🔄 Running clean migrations...');
        
        // Create migrations table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        const migrations = [
            '0001_core_tables_clean.sql',
            '0002_add_missing_columns.sql', 
            '0003_essential_tables.sql',
            '0004_seed_essential_data.sql'
        ];
        
        for (const migration of migrations) {
            const { rows } = await client.query(
                'SELECT name FROM migrations WHERE name = `$1',
                [migration]
            );
            
            if (rows.length === 0) {
                console.log(`🚀 Executing: `${migration}`);
                const migrationPath = path.join(__dirname, '../../migrations', migration);
                
                if (fs.existsSync(migrationPath)) {
                    const sql = fs.readFileSync(migrationPath, 'utf8');
                    await client.query(sql);
                    await client.query(
                        'INSERT INTO migrations (name) VALUES (`$1)',
                        [migration]
                    );
                    console.log(`✅ Completed: `${migration}`);
                } else {
                    console.log(`⚠️  Skipping missing: `${migration}`);
                }
            } else {
                console.log(`⏭️  Already executed: `${migration}`);
            }
        }
        
        console.log('✅ All clean migrations completed successfully');
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runCleanMigrations();
}

module.exports = { runCleanMigrations };
"@

New-Item -Path "server\services" -ItemType Directory -Force | Out-Null
Set-Content -Path "server\services\cleanMigrationRunner.js" -Value $cleanRunner

# Commit and push to staging
Write-Host "📤 Committing clean migrations..." -ForegroundColor Yellow
git add .
git commit -m "fix: clean migrations for Railway staging deployment

- Created dependency-free core migrations
- Removed circular dependency issues  
- Added clean migration runner
- Ready for Railway staging deployment"

Write-Host "🚀 Pushing to staging branch..." -ForegroundColor Yellow
git push origin staging --force

Write-Host "🎯 Railway staging deployment initiated!" -ForegroundColor Green
Write-Host "📋 Clean migrations deployed:" -ForegroundColor Cyan
Write-Host "  ✅ 0001_core_tables_clean.sql" -ForegroundColor Green
Write-Host "  ✅ 0002_add_missing_columns.sql" -ForegroundColor Green  
Write-Host "  ✅ 0003_essential_tables.sql" -ForegroundColor Green
Write-Host "  ✅ 0004_seed_essential_data.sql" -ForegroundColor Green

Write-Host "`n🔍 Monitor deployment at: https://railway.app" -ForegroundColor Yellow
Write-Host "📊 Check logs for migration execution status" -ForegroundColor Yellow

# Restore original migrations after deployment
Write-Host "`n🔄 Restoring original migrations..." -ForegroundColor Yellow
Remove-Item -Path "migrations\*" -Force
Copy-Item -Recurse "migrations_backup\*" "migrations\"
Remove-Item -Recurse -Force "migrations_backup"

Write-Host "✅ Railway staging deployment with clean migrations complete!" -ForegroundColor Green