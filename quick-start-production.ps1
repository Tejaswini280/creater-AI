Write-Host "🚀 Quick Start - Creator AI Studio (Production)" -ForegroundColor Cyan

# Kill any existing processes
taskkill /F /IM node.exe 2>$null

# Set environment variables
$env:NODE_ENV = "production"
$env:PORT = "5000"

Write-Host "🌐 Starting server on http://localhost:5000" -ForegroundColor Green
Write-Host "⚠️  Make sure to use HTTP (not HTTPS)" -ForegroundColor Yellow

# Start the production server directly
node dist/index.js