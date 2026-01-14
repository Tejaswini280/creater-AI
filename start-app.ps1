# Start Creator AI Studio Application
Write-Host "🚀 Starting Creator AI Studio Application" -ForegroundColor Green

# Check if PostgreSQL is running
Write-Host "📊 Checking PostgreSQL service..." -ForegroundColor Yellow
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "✅ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL is not running. Attempting to start..." -ForegroundColor Yellow
        try {
            Start-Service $pgService.Name
            Write-Host "✅ PostgreSQL started successfully" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to start PostgreSQL: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "⚠️  PostgreSQL service not found. Make sure PostgreSQL is installed." -ForegroundColor Yellow
}

# Start the application
Write-Host "`n🚀 Starting Creator AI Studio..." -ForegroundColor Green
Write-Host "Backend will run on: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend will run on: http://localhost:3000" -ForegroundColor Cyan

# Start the development server
npm run dev