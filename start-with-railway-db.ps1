# ═══════════════════════════════════════════════════════════════════════════════
# START APPLICATION WITH RAILWAY DATABASE
# ═══════════════════════════════════════════════════════════════════════════════
# This script starts your application using the Railway database connection
# This will fix your 502 error by using the correct database
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 STARTING APPLICATION WITH RAILWAY DATABASE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "This will connect to your Railway database and fix the 502 error" -ForegroundColor Yellow
Write-Host ""

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Red
    Write-Host "Please install Railway CLI: https://docs.railway.app/develop/cli" -ForegroundColor Yellow
    Write-Host "Or run: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔧 Starting application with Railway database connection..." -ForegroundColor Green

# Start the application using Railway's environment
try {
    railway run npm start
} catch {
    Write-Host "❌ Failed to start with Railway database" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Alternative: Try starting in development mode with local database" -ForegroundColor Yellow
    Write-Host "Run: .\start-dev-mode.ps1" -ForegroundColor Yellow
    exit 1
}