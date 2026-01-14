# Development Environment Fix Script
Write-Host "🔧 Fixing Development Environment Issues..." -ForegroundColor Green

# Stop any running Node processes
Write-Host "🛑 Stopping existing Node processes..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*node*" -or $_.ProcessName -like "*npm*"} | Stop-Process -Force -ErrorAction SilentlyContinue

# Clear Vite cache
Write-Host "🧹 Clearing Vite cache..." -ForegroundColor Yellow
Remove-Item -Path "node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "client\node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue

# Clear npm cache
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Start the development server
Write-Host "🚀 Starting development server..." -ForegroundColor Green
Write-Host "✅ Server will start on http://localhost:3000" -ForegroundColor Green
Write-Host "✅ API proxy will forward to http://localhost:5000" -ForegroundColor Green
Write-Host "✅ WebSocket will use relative URLs for proper proxying" -ForegroundColor Green

# Start the server
npm run dev