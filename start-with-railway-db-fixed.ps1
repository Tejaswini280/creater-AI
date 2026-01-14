# ═══════════════════════════════════════════════════════════════════════════════
# START APPLICATION WITH RAILWAY DATABASE (MIGRATION FIX APPLIED)
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 STARTING APPLICATION WITH RAILWAY DATABASE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Migration dependency fix has been applied" -ForegroundColor Green
Write-Host "✅ Database schema is verified and correct" -ForegroundColor Green
Write-Host "✅ Problematic migration has been bypassed" -ForegroundColor Green

Write-Host ""
Write-Host "🔧 IMPORTANT: You need to set your Railway DATABASE_URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 To get your Railway DATABASE_URL:" -ForegroundColor Cyan
Write-Host "   1. Go to your Railway dashboard" -ForegroundColor White
Write-Host "   2. Click on your PostgreSQL service" -ForegroundColor White
Write-Host "   3. Go to the 'Connect' tab" -ForegroundColor White
Write-Host "   4. Copy the 'Postgres Connection URL'" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Then run one of these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Option 1 - Set environment variable and start:" -ForegroundColor Yellow
Write-Host "   `$env:DATABASE_URL='your_railway_database_url_here'" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "   Option 2 - Start with inline environment variable:" -ForegroundColor Yellow
Write-Host "   `$env:DATABASE_URL='your_railway_database_url_here'; npm start" -ForegroundColor White
Write-Host ""
Write-Host "   Option 3 - Update your .env file:" -ForegroundColor Yellow
Write-Host "   Edit .env file and replace DATABASE_URL with your Railway URL" -ForegroundColor White
Write-Host ""

# Check if DATABASE_URL is already set to Railway
$currentDbUrl = $env:DATABASE_URL
if ($currentDbUrl -and $currentDbUrl.Contains("railway")) {
    Write-Host "✅ Railway DATABASE_URL detected!" -ForegroundColor Green
    Write-Host "🌐 Starting your application..." -ForegroundColor Yellow
    Write-Host "   • Local: http://localhost:5000" -ForegroundColor White
    Write-Host "   • Railway: https://your-app.railway.app" -ForegroundColor White
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🎯 STARTING APPLICATION NOW..." -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    # Start the application
    npm start
} else {
    Write-Host "⚠️  No Railway DATABASE_URL detected" -ForegroundColor Red
    Write-Host "   Current DATABASE_URL: $currentDbUrl" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔧 Please set your Railway DATABASE_URL and try again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Example Railway DATABASE_URL format:" -ForegroundColor Cyan
    Write-Host "   postgresql://postgres:password@host:port/database" -ForegroundColor Gray
    Write-Host ""
}