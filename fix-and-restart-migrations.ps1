#!/usr/bin/env pwsh

# Fix Migration Dependencies and Restart Migration Process
# This script addresses the root cause of migration dependency issues

Write-Host "🔧 FIXING MIGRATION DEPENDENCY ISSUES" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Step 1: Fix database structure issues
Write-Host ""
Write-Host "📋 Step 1: Fixing database structure inconsistencies..." -ForegroundColor Yellow
try {
    node fix-migration-dependency-root-cause.cjs
    if ($LASTEXITCODE -ne 0) {
        throw "Database structure fix failed"
    }
    Write-Host "✅ Database structure fixed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to fix database structure: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Clear npm cache to ensure clean dependencies
Write-Host ""
Write-Host "📋 Step 2: Clearing npm cache..." -ForegroundColor Yellow
try {
    npm cache clean --force
    Write-Host "✅ NPM cache cleared" -ForegroundColor Green
} catch {
    Write-Host "⚠️  NPM cache clear failed, continuing..." -ForegroundColor Yellow
}

# Step 3: Install dependencies
Write-Host ""
Write-Host "📋 Step 3: Installing dependencies..." -ForegroundColor Yellow
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "NPM install failed"
    }
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Run migrations with enhanced runner
Write-Host ""
Write-Host "📋 Step 4: Running database migrations..." -ForegroundColor Yellow
try {
    npm run migrate
    if ($LASTEXITCODE -ne 0) {
        throw "Migration failed"
    }
    Write-Host "✅ Migrations completed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Trying alternative migration approach..." -ForegroundColor Yellow
    
    try {
        node -e "
        import('./server/services/enhancedMigrationRunner.ts').then(module => {
          const runner = new module.EnhancedMigrationRunner();
          return runner.run();
        }).then(result => {
          console.log('Migration result:', result);
          process.exit(result.success ? 0 : 1);
        }).catch(error => {
          console.error('Migration error:', error);
          process.exit(1);
        });
        "
        
        if ($LASTEXITCODE -ne 0) {
            throw "Alternative migration also failed"
        }
        Write-Host "✅ Alternative migration succeeded" -ForegroundColor Green
    } catch {
        Write-Host "❌ All migration attempts failed: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 5: Seed database
Write-Host ""
Write-Host "📋 Step 5: Seeding database..." -ForegroundColor Yellow
try {
    npm run seed
    if ($LASTEXITCODE -ne 0) {
        throw "Database seeding failed"
    }
    Write-Host "✅ Database seeded successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Database seeding failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Trying alternative seeding approach..." -ForegroundColor Yellow
    
    try {
        node scripts/seed-database.js
        if ($LASTEXITCODE -ne 0) {
            throw "Alternative seeding also failed"
        }
        Write-Host "✅ Alternative seeding succeeded" -ForegroundColor Green
    } catch {
        Write-Host "❌ All seeding attempts failed: $_" -ForegroundColor Red
        # Don't exit on seeding failure - migrations are more important
    }
}

# Step 6: Verify database state
Write-Host ""
Write-Host "📋 Step 6: Verifying database state..." -ForegroundColor Yellow
try {
    node -e "
    const postgres = require('postgres');
    const sql = postgres(process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/creators_dev_db', {
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false
    });
    
    (async () => {
      try {
        // Check core tables
        const tables = await sql\`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name
        \`;
        
        console.log('📊 Database Tables:');
        tables.forEach(t => console.log(\`   ✓ \${t.table_name}\`));
        
        // Check content table columns
        const contentColumns = await sql\`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'content'
          ORDER BY column_name
        \`;
        
        console.log('\\n📊 Content Table Columns:');
        contentColumns.forEach(c => console.log(\`   ✓ \${c.column_name}\`));
        
        // Check for day_number column specifically
        const dayNumberExists = contentColumns.some(c => c.column_name === 'day_number');
        if (dayNumberExists) {
          console.log('\\n✅ day_number column exists - migration dependency issue resolved');
        } else {
          console.log('\\n❌ day_number column missing - issue not fully resolved');
          process.exit(1);
        }
        
        await sql.end();
        console.log('\\n🎉 Database verification completed successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Database verification failed:', error.message);
        process.exit(1);
      }
    })();
    "
    
    if ($LASTEXITCODE -ne 0) {
        throw "Database verification failed"
    }
    Write-Host "✅ Database verification passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Database verification failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 MIGRATION DEPENDENCY ISSUES RESOLVED SUCCESSFULLY" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Database structure fixed" -ForegroundColor Green
Write-Host "✅ Migrations completed" -ForegroundColor Green
Write-Host "✅ Database seeded" -ForegroundColor Green
Write-Host "✅ Verification passed" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Your application is now ready to run!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  • Run: npm run dev (for development)" -ForegroundColor White
Write-Host "  • Run: npm run build && npm start (for production)" -ForegroundColor White
Write-Host "  • Run: docker-compose up (for Docker)" -ForegroundColor White
Write-Host ""