Write-Host "🚀 Starting Creator AI Studio in Production Mode..." -ForegroundColor Cyan

Write-Host "🛑 Stopping existing processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null

Write-Host "🏗️ Building application..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

$env:NODE_ENV = "production"
$env:PORT = "5000"

Write-Host "🌐 Starting production server on port 5000..." -ForegroundColor Cyan
Write-Host "🎉 Application will be available at: http://localhost:5000" -ForegroundColor Green

npm start