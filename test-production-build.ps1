Write-Host "🔨 Testing production build locally..." -ForegroundColor Green

# Build the application
Write-Host "Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Start the production server
Write-Host "Starting production server on port 5000..." -ForegroundColor Yellow
Write-Host "Visit http://localhost:5000 to test" -ForegroundColor Cyan
Write-Host "Visit http://localhost:5000/test-railway-deployment.html for diagnostics" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray

npm start