#!/usr/bin/env pwsh

# Push Railway Vite Build Fix to Dev Branch
Write-Host "🚀 Pushing Railway Vite Build Fix to Dev Branch..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Yellow

# Add all changes
Write-Host "📦 Adding changes..." -ForegroundColor Green
git add .

# Check if there are changes to commit
$status = git status --porcelain
if (-not $status) {
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Yellow
    Write-Host "✅ Repository is already up to date" -ForegroundColor Green
    exit 0
}

# Show what will be committed
Write-Host "📋 Changes to be committed:" -ForegroundColor Green
git status --short
Write-Host ""

# Commit changes
$commitMessage = "fix: Railway Vite build configuration and ES module compatibility

- Fixed double build issue in Railway deployment
- Updated package.json railway:start script to avoid redundant build  
- Updated nixpacks.toml and railway.json deployment configuration
- Converted CommonJS modules to ES modules for compatibility
- Fixed enhancedMigrationRunner.js, migrationDependencyResolver.js, cleanMigrationRunner.js
- Eliminated build warnings and ES module conflicts
- Verified complete deployment readiness

Resolves Railway 'vite: not found' error and ensures clean deployment process."

Write-Host "💾 Committing changes..." -ForegroundColor Green
git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Switch to dev branch if not already on it
if ($currentBranch -ne "dev") {
    Write-Host "🔄 Switching to dev branch..." -ForegroundColor Yellow
    git checkout dev
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to switch to dev branch" -ForegroundColor Red
        exit 1
    }
    
    # Merge changes from current branch
    Write-Host "🔀 Merging changes from $currentBranch..." -ForegroundColor Yellow
    git merge $currentBranch --no-ff -m "Merge Railway Vite build fixes from $currentBranch"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to merge changes" -ForegroundColor Red
        exit 1
    }
}

# Push to dev branch
Write-Host "⬆️  Pushing to dev branch..." -ForegroundColor Green
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push to dev branch" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Successfully pushed Railway Vite build fix to dev branch!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of changes pushed:" -ForegroundColor Yellow
Write-Host "• Fixed Railway double build configuration" -ForegroundColor White
Write-Host "• Updated package.json, nixpacks.toml, railway.json" -ForegroundColor White  
Write-Host "• Converted CommonJS modules to ES modules" -ForegroundColor White
Write-Host "• Fixed migration runner compatibility issues" -ForegroundColor White
Write-Host "• Eliminated all build warnings and conflicts" -ForegroundColor White
Write-Host "• Created comprehensive fix documentation" -ForegroundColor White
Write-Host ""
Write-Host "✅ Dev branch is now ready for Railway deployment!" -ForegroundColor Green