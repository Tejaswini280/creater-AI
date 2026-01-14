# Simple Railway Database Fix Script
Write-Host "🔧 Running Railway database schema fix..." -ForegroundColor Green

# Check if Railway CLI is available
if (Get-Command railway -ErrorAction SilentlyContinue) {
    Write-Host "✅ Railway CLI found" -ForegroundColor Green
    
    # Run the database fix on Railway
    Write-Host "🚀 Executing database fix on Railway..." -ForegroundColor Blue
    railway run node fix-railway-production-only.cjs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database fix completed successfully!" -ForegroundColor Green
        Write-Host "🔄 Restarting Railway service..." -ForegroundColor Blue
        railway up --detach
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🎉 Railway service restarted successfully!" -ForegroundColor Green
            Write-Host "🌐 Your application should be working now." -ForegroundColor Cyan
        } else {
            Write-Host "⚠️ Service restart failed, but database fix was successful." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Database fix failed!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Railway CLI not found. Please install it:" -ForegroundColor Red
    Write-Host "npm install -g @railway/cli" -ForegroundColor Yellow
    Write-Host "Then run: railway login" -ForegroundColor Yellow
}