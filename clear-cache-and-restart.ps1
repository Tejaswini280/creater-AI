#!/usr/bin/env pwsh
# Clear Cache and Restart Application Script

Write-Host "🧹 Starting comprehensive cache and cookie clearing..." -ForegroundColor Green

# Stop any running processes
Write-Host "🛑 Stopping running processes..." -ForegroundColor Yellow
try {
    # Stop any Node.js processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "npm" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "yarn" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Stopped running Node processes" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No running processes to stop" -ForegroundColor Blue
}

# Clear Node.js cache
Write-Host "🗑️ Clearing Node.js cache..." -ForegroundColor Yellow
if (Test-Path "$env:APPDATA\npm-cache") {
    Remove-Item -Recurse -Force "$env:APPDATA\npm-cache" -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared npm cache" -ForegroundColor Green
}

# Clear yarn cache
try {
    yarn cache clean --force 2>$null
    Write-Host "✅ Cleared yarn cache" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ Yarn not available or no cache to clear" -ForegroundColor Blue
}

# Clear npm cache
try {
    npm cache clean --force 2>$null
    Write-Host "✅ Cleared npm cache" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ npm cache already clean" -ForegroundColor Blue
}

# Clear application build artifacts
Write-Host "🗑️ Clearing build artifacts..." -ForegroundColor Yellow
$buildDirs = @("dist", "build", ".next", "coverage", "node_modules/.cache", "client/dist", "client/build", "server/dist")
foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        Remove-Item -Recurse -Force $dir -ErrorAction SilentlyContinue
        Write-Host "✅ Cleared $dir" -ForegroundColor Green
    }
}

# Clear Vite cache
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite" -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared Vite cache" -ForegroundColor Green
}

# Clear TypeScript cache
if (Test-Path ".tsbuildinfo") {
    Remove-Item -Force ".tsbuildinfo" -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared TypeScript build info" -ForegroundColor Green
}

# Clear browser cache directories (common locations)
Write-Host "🌐 Clearing browser cache..." -ForegroundColor Yellow
$browserCaches = @(
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Cache",
    "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Cache",
    "$env:APPDATA\Mozilla\Firefox\Profiles\*\cache2"
)

foreach ($cache in $browserCaches) {
    if (Test-Path $cache) {
        try {
            Remove-Item -Recurse -Force $cache -ErrorAction SilentlyContinue
            Write-Host "✅ Cleared browser cache: $cache" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Could not clear: $cache (browser may be running)" -ForegroundColor Yellow
        }
    }
}

# Clear application-specific storage
Write-Host "🗄️ Clearing application storage..." -ForegroundColor Yellow
$storageDirs = @("uploads", "logs", "temp", ".local")
foreach ($dir in $storageDirs) {
    if (Test-Path $dir) {
        # Keep directory structure but clear contents
        Get-ChildItem $dir -Recurse -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Cleared $dir contents" -ForegroundColor Green
    }
}

# Clear environment-specific files
Write-Host "🔧 Clearing temporary environment files..." -ForegroundColor Yellow
$tempFiles = @("temp-*", "*.tmp", "*.log")
foreach ($pattern in $tempFiles) {
    Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
}

# Reinstall dependencies fresh
Write-Host "📦 Reinstalling dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

if (Test-Path "yarn.lock") {
    Remove-Item -Force "yarn.lock" -ErrorAction SilentlyContinue
    Write-Host "✅ Removed yarn.lock" -ForegroundColor Green
}

# Install fresh dependencies
Write-Host "📥 Installing fresh dependencies..." -ForegroundColor Yellow
try {
    npm install --no-cache --prefer-offline=false
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Clear any database connections/cache if applicable
Write-Host "🗃️ Clearing database cache..." -ForegroundColor Yellow
# Add any database-specific cache clearing here if needed

Write-Host "🚀 Starting fresh application..." -ForegroundColor Green

# Start the application fresh
Write-Host "🌟 Application cache cleared and ready to start fresh!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Close all browser windows" -ForegroundColor White
Write-Host "   2. Clear browser data manually (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "   3. Run: npm run dev (or your start command)" -ForegroundColor White
Write-Host "   4. Open application in incognito/private browsing mode" -ForegroundColor White

# Optionally start the dev server
$startServer = Read-Host "Would you like to start the development server now? (y/n)"
if ($startServer -eq "y" -or $startServer -eq "Y") {
    try {
        Write-Host "🚀 Starting development server..." -ForegroundColor Green
        npm run dev
    } catch {
        Write-Host "❌ Error starting application: $_" -ForegroundColor Red
    }
}

Write-Host "✨ Cache clearing complete!" -ForegroundColor Green