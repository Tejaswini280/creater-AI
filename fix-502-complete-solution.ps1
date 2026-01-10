# ═══════════════════════════════════════════════════════════════════════════════
# COMPLETE 502 ERROR SOLUTION
# ═══════════════════════════════════════════════════════════════════════════════
# This script provides multiple solutions to fix your 502 error
# Choose the option that works best for your setup
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🔧 COMPLETE 502 ERROR SOLUTION" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Your 502 error is caused by database connection issues." -ForegroundColor Yellow
Write-Host "Choose one of these solutions:" -ForegroundColor Yellow
Write-Host ""

Write-Host "OPTION 1: Use Railway Database (Recommended)" -ForegroundColor Green
Write-Host "   - Connects to your deployed Railway database" -ForegroundColor White
Write-Host "   - Run: .\start-with-railway-db.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPTION 2: Development Mode with Local Setup" -ForegroundColor Green
Write-Host "   - Starts in development mode" -ForegroundColor White
Write-Host "   - Run: .\start-dev-mode.ps1" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPTION 3: Docker Database Setup" -ForegroundColor Green
Write-Host "   - Uses Docker for local database" -ForegroundColor White
Write-Host "   - Run: docker-compose up -d && npm run dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "OPTION 4: Manual Railway Connection" -ForegroundColor Green
Write-Host "   - Set your Railway DATABASE_URL manually" -ForegroundColor White
Write-Host "   - Get it from: railway variables" -ForegroundColor Cyan
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Ask user which option they want
$choice = Read-Host "Which option would you like to try? (1/2/3/4)"

switch ($choice) {
    "1" {
        Write-Host "🚀 Starting with Railway database..." -ForegroundColor Green
        .\start-with-railway-db.ps1
    }
    "2" {
        Write-Host "🚀 Starting in development mode..." -ForegroundColor Green
        .\start-dev-mode.ps1
    }
    "3" {
        Write-Host "🚀 Starting Docker database..." -ForegroundColor Green
        docker-compose up -d
        Start-Sleep -Seconds 10
        npm run dev
    }
    "4" {
        Write-Host "🔧 Manual Railway connection setup:" -ForegroundColor Green
        Write-Host "1. Run: railway login" -ForegroundColor Cyan
        Write-Host "2. Run: railway link" -ForegroundColor Cyan
        Write-Host "3. Run: railway variables" -ForegroundColor Cyan
        Write-Host "4. Copy the DATABASE_URL and set it in your .env file" -ForegroundColor Cyan
        Write-Host "5. Run: npm start" -ForegroundColor Cyan
    }
    default {
        Write-Host "❌ Invalid choice. Please run the script again and choose 1, 2, 3, or 4." -ForegroundColor Red
    }
}