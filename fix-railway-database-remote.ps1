# Fix Railway Database Schema Remotely
# This script connects to your Railway database and fixes the schema issues

Write-Host "🔧 Fixing Railway database schema remotely..." -ForegroundColor Green

# Step 1: Get Railway database URL
Write-Host "📡 Getting Railway database connection..." -ForegroundColor Yellow

try {
    $databaseUrl = railway variables get DATABASE_URL
    
    if (-not $databaseUrl) {
        Write-Host "❌ Could not get DATABASE_URL from Railway!" -ForegroundColor Red
        Write-Host "💡 Make sure you're logged in to Railway CLI: railway login" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Got database connection string" -ForegroundColor Green
    
    # Step 2: Set environment variable and run schema fix
    $env:DATABASE_URL = $databaseUrl
    $env:NODE_ENV = "production"
    
    Write-Host "🔧 Running database schema migration..." -ForegroundColor Yellow
    node fix-railway-database-schema-complete.cjs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database schema fixed successfully!" -ForegroundColor Green
        
        # Step 3: Restart Railway service to pick up changes
        Write-Host "🔄 Restarting Railway service..." -ForegroundColor Yellow
        railway service restart
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Railway service restarted!" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Service restart may have failed - check Railway dashboard" -ForegroundColor Yellow
        }
        
        # Step 4: Get service URL and test
        Write-Host "🧪 Testing the fixed deployment..." -ForegroundColor Yellow
        Start-Sleep -Seconds 15  # Wait for service to restart
        
        $serviceInfo = railway status --json 2>$null | ConvertFrom-Json
        
        if ($serviceInfo -and $serviceInfo.url) {
            $railwayUrl = $serviceInfo.url
            Write-Host "🌐 Testing: $railwayUrl" -ForegroundColor Cyan
            
            try {
                $healthResponse = Invoke-RestMethod -Uri "$railwayUrl/api/health" -TimeoutSec 30
                if ($healthResponse.status -eq "ok") {
                    Write-Host "✅ Health check passed!" -ForegroundColor Green
                    Write-Host "🎉 Your application is now working!" -ForegroundColor Green
                    Write-Host "🔗 Application URL: $railwayUrl" -ForegroundColor Cyan
                } else {
                    Write-Host "⚠️ Health check returned: $($healthResponse.status)" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️ Health check failed - service may still be starting" -ForegroundColor Yellow
                Write-Host "🔗 Check manually: $railwayUrl" -ForegroundColor Cyan
            }
        }
        
    } else {
        Write-Host "❌ Database schema fix failed!" -ForegroundColor Red
        Write-Host "📋 Check the error messages above for details" -ForegroundColor Yellow
        exit 1
    }
    
} catch {
    Write-Host "❌ Error connecting to Railway: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure you're logged in: railway login" -ForegroundColor Yellow
    Write-Host "💡 Make sure you're in the correct project: railway link" -ForegroundColor Yellow
    exit 1
}

Write-Host "🎯 Database fix completed!" -ForegroundColor Green