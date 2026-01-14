#!/usr/bin/env pwsh

# Simple script to push app lifecycle manager to dev branch

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "PUSHING APP LIFECYCLE MANAGER TO DEV BRANCH" -ForegroundColor Cyan
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Ensure we're on the correct branch or switch to dev
if ($currentBranch -ne "dev") {
    Write-Host "Switching to dev branch..." -ForegroundColor Yellow
    
    # Check if dev branch exists
    $devExists = git branch --list dev
    if (-not $devExists) {
        Write-Host "Creating dev branch from current branch..." -ForegroundColor Yellow
        git checkout -b dev
    } else {
        git checkout dev
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to switch to dev branch" -ForegroundColor Red
            exit 1
        }
    }
}

# Pull latest changes from dev (if remote exists)
Write-Host "Pulling latest changes from dev..." -ForegroundColor Yellow
git pull origin dev 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully pulled latest changes" -ForegroundColor Green
} else {
    Write-Host "No remote dev branch found or pull failed - continuing with local changes" -ForegroundColor Yellow
}

# Add all changes
Write-Host ""
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$changes = git diff --cached --name-only
if (-not $changes) {
    Write-Host ""
    Write-Host "No changes to commit - files may already be up to date" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Current status:" -ForegroundColor Yellow
    git status
    exit 0
}

# Show what will be committed
Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor Yellow
git diff --cached --name-status

# Create commit message
$commitMessage = "feat: Add enterprise app lifecycle manager

NEW: run-creator-ai-studio.mjs - Complete application lifecycle management
- Cross-platform support (Windows + macOS + Linux)
- Full stack orchestration (frontend, backend, database)
- Docker Compose integration with PostgreSQL + Redis
- Database migrations and seeding automation
- Port conflict resolution with safety prompts
- Process management with health checks
- Comprehensive logging and state management
- Enterprise reliability features

UPDATED: package.json - Added convenience scripts
- npm run setup / app:start / app:stop / app:restart
- npm run app:status / app:logs / app:clean / app:doctor

NEW: APP_LIFECYCLE_MANAGER_USAGE.md - Comprehensive usage guide

COMMANDS AVAILABLE:
- setup: First-time repository setup
- start: Start all services with health checks  
- stop: Graceful shutdown of all services
- restart: Stop + start sequence
- status: Real-time service status
- logs: Log viewing with streaming support
- clean: Reset to clean state
- db:reset: Database management
- doctor: Comprehensive diagnostics

USAGE:
  node run-creator-ai-studio.mjs setup
  node run-creator-ai-studio.mjs start
  npm run app:start"

# Commit the changes
Write-Host ""
Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully committed changes" -ForegroundColor Green
} else {
    Write-Host "Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Push to dev branch
Write-Host ""
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Green
    Write-Host "SUCCESSFULLY PUSHED APP LIFECYCLE MANAGER TO DEV BRANCH" -ForegroundColor Green
    Write-Host "===============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Files pushed:" -ForegroundColor Green
    Write-Host "  - run-creator-ai-studio.mjs (Enterprise app lifecycle manager)" -ForegroundColor White
    Write-Host "  - package.json (Updated with convenience scripts)" -ForegroundColor White
    Write-Host "  - APP_LIFECYCLE_MANAGER_USAGE.md (Comprehensive usage guide)" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  - Test the lifecycle manager: node run-creator-ai-studio.mjs doctor" -ForegroundColor White
    Write-Host "  - Run setup: node run-creator-ai-studio.mjs setup" -ForegroundColor White
    Write-Host "  - Start application: node run-creator-ai-studio.mjs start" -ForegroundColor White
    Write-Host "  - Or use npm scripts: npm run setup && npm run app:start" -ForegroundColor White
    Write-Host ""
    Write-Host "Documentation: APP_LIFECYCLE_MANAGER_USAGE.md" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Failed to push to dev branch" -ForegroundColor Red
    Write-Host "Please check your git configuration and network connection" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual push command:" -ForegroundColor Yellow
    Write-Host "  git push origin dev" -ForegroundColor White
    exit 1
}

# Show final git log
Write-Host "Latest commits on dev branch:" -ForegroundColor Yellow
git log --oneline -5

Write-Host ""
Write-Host "App Lifecycle Manager successfully deployed to dev branch!" -ForegroundColor Green
Write-Host ""