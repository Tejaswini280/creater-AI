# Run application with Railway database connection
# This script uses the Railway database URL from the logs

Write-Host "🚀 Starting application with Railway database..." -ForegroundColor Green

# Set the Railway database URL from the logs
$env:DATABASE_URL = "postgresql://postgres:***@postgres.railway.internal:5432/railway"
$env:NODE_ENV = "production"
$env:PORT = "5000"

# Set API keys from .env.new (which should have the real keys)
if (Test-Path ".env.new") {
    Write-Host "📋 Loading API keys from .env.new..." -ForegroundColor Yellow
    Get-Content ".env.new" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value -and $value -ne "your_*_key_here") {
                Set-Item -Path "env:$key" -Value $value
                Write-Host "✅ Set $key" -ForegroundColor Green
            }
        }
    }
}

Write-Host "🔌 Database URL: $($env:DATABASE_URL.Substring(0, 50))..." -ForegroundColor Cyan
Write-Host "🌍 Environment: $env:NODE_ENV" -ForegroundColor Cyan

# Start the application
npm start