# Run Creator AI Studio in Production Mode (Local)
Write-Host "🚀 Starting Creator AI Studio in Production Mode..." -ForegroundColor Cyan

# Stop any existing development servers
Write-Host "🛑 Stopping existing processes..." -ForegroundColor Yellow
try {
    taskkill /F /IM node.exe 2>$null
    Write-Host "✅ Stopped existing Node.js processes" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No existing Node.js processes found" -ForegroundColor Gray
}

# Build the application
Write-Host "🏗️ Building application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Set production environment
$env:NODE_ENV = "production"
$env:PORT = "5000"

Write-Host "🌐 Starting production server..." -ForegroundColor Cyan
Write-Host "   Environment: $env:NODE_ENV" -ForegroundColor Gray
Write-Host "   Port: $env:PORT" -ForegroundColor Gray

# Start the production server
Write-Host ""
Write-Host "🎉 Creator AI Studio is starting..." -ForegroundColor Green
Write-Host "🌐 Application will be available at: http://localhost:5000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Run the production server
npm start