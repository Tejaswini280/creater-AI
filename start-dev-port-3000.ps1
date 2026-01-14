# Start development server on port 3000
Write-Host "🚀 Starting CreatorNexus development server on port 3000..." -ForegroundColor Green

# Set environment variables
$env:NODE_ENV = "development"
$env:PORT = "3000"
$env:SKIP_RATE_LIMIT = "1"

Write-Host "🌍 Environment: $env:NODE_ENV" -ForegroundColor Cyan
Write-Host "🚀 Port: $env:PORT" -ForegroundColor Cyan

# Start the development server
npx tsx server/index.ts