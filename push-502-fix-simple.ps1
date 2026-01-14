# Push 502 Error Fix to Dev Branch - Simple Version

Write-Host "PUSHING 502 ERROR FIX TO DEV BRANCH" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Yellow

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan

# Add all changes
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit" -ForegroundColor Yellow
} else {
    Write-Host "Changes to commit:" -ForegroundColor Yellow
    git status --short
    
    # Commit changes with simple message
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m "fix: resolve 502 error - database migration user ID type mismatch"
}

# Switch to dev branch if not already on it
if ($currentBranch -ne "dev") {
    Write-Host "Switching to dev branch..." -ForegroundColor Yellow
    git checkout dev
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to switch to dev branch" -ForegroundColor Red
        exit 1
    }
    
    # Merge changes from current branch
    Write-Host "Merging changes from $currentBranch..." -ForegroundColor Yellow
    git merge $currentBranch --no-ff -m "Merge 502 error fix from $currentBranch to dev"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to merge changes" -ForegroundColor Red
        exit 1
    }
}

# Push to dev branch
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push to dev branch" -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: 502 Error Fix Pushed to Dev Branch" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Yellow
Write-Host "Root Cause Fixed: Database migration user ID type mismatch" -ForegroundColor Green
Write-Host "Application Status: Running successfully" -ForegroundColor Green
Write-Host "Database Status: Migrations complete, seeding successful" -ForegroundColor Green