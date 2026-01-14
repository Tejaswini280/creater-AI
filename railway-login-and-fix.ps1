# Railway Login and Database Fix Script
# This script will help you login to Railway and fix the database schema

Write-Host "🚂 Railway Login and Database Fix" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

Write-Host "📋 Step 1: Login to Railway" -ForegroundColor Yellow
Write-Host "Please run the following command and follow the prompts:" -ForegroundColor White
Write-Host "railway login" -ForegroundColor Cyan
Write-Host ""
Write-Host "After logging in, press Enter to continue..." -ForegroundColor Yellow
Read-Host

Write-Host "📋 Step 2: Link to your project" -ForegroundColor Yellow
Write-Host "If you haven't linked to your project yet, run:" -ForegroundColor White
Write-Host "railway link" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter when ready to continue..." -ForegroundColor Yellow
Read-Host

Write-Host "📋 Step 3: Check Railway status" -ForegroundColor Yellow
try {
    $status = railway status --json | ConvertFrom-Json
    Write-Host "✅ Connected to Railway project" -ForegroundColor Green
    Write-Host "- Service: $($status.serviceId)" -ForegroundColor White
    Write-Host "- Environment: $($status.environment)" -ForegroundColor White
    Write-Host "- URL: $($status.url)" -ForegroundColor White
    
    if ($status.url) {
        $railwayUrl = $status.url
        Write-Host "🌐 Your application URL: $railwayUrl" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Could not get Railway status. Make sure you're logged in and linked." -ForegroundColor Red
    Write-Host "Run: railway login && railway link" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Step 4: Fix database schema" -ForegroundColor Yellow
Write-Host "Getting database connection string..." -ForegroundColor White

try {
    $databaseUrl = railway variables get DATABASE_URL
    
    if ($databaseUrl -and $databaseUrl -ne "null") {
        Write-Host "✅ Got database connection" -ForegroundColor Green
        
        # Set environment variable for the schema fix script
        $env:DATABASE_URL = $databaseUrl
        $env:NODE_ENV = "production"
        
        Write-Host "🔧 Running database schema fix..." -ForegroundColor Yellow
        node fix-railway-database-schema-complete.cjs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database schema fixed!" -ForegroundColor Green
            
            Write-Host "📋 Step 5: Restart Railway service" -ForegroundColor Yellow
            railway service restart
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Service restarted!" -ForegroundColor Green
                
                Write-Host "⏳ Waiting for service to come online..." -ForegroundColor Yellow
                Start-Sleep -Seconds 20
                
                if ($railwayUrl) {
                    Write-Host "🧪 Testing your application..." -ForegroundColor Yellow
                    
                    try {
                        $response = Invoke-RestMethod -Uri "$railwayUrl/api/health" -TimeoutSec 30
                        if ($response.status -eq "ok") {
                            Write-Host "🎉 SUCCESS! Your application is now working!" -ForegroundColor Green
                            Write-Host "🔗 Application: $railwayUrl" -ForegroundColor Cyan
                            Write-Host "🔗 Health: $railwayUrl/api/health" -ForegroundColor Cyan
                        } else {
                            Write-Host "⚠️ Application responded but may have issues" -ForegroundColor Yellow
                        }
                    } catch {
                        Write-Host "⚠️ Could not test application - it may still be starting" -ForegroundColor Yellow
                        Write-Host "🔗 Try accessing: $railwayUrl" -ForegroundColor Cyan
                    }
                }
            } else {
                Write-Host "⚠️ Service restart may have failed" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ Database schema fix failed!" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Could not get DATABASE_URL from Railway" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error getting database URL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Manual steps if needed:" -ForegroundColor Yellow
Write-Host "1. railway login" -ForegroundColor White
Write-Host "2. railway link" -ForegroundColor White
Write-Host "3. railway variables get DATABASE_URL" -ForegroundColor White
Write-Host "4. Set DATABASE_URL environment variable" -ForegroundColor White
Write-Host "5. node fix-railway-database-schema-complete.cjs" -ForegroundColor White
Write-Host "6. railway service restart" -ForegroundColor White