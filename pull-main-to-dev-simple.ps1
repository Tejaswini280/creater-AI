# Pull Main Branch into Dev Branch Script
# This script safely merges all changes from main branch into dev branch

Write-Host "Starting Main to Dev Branch Merge Process..." -ForegroundColor Cyan

# Check current git status
Write-Host "Checking current git status..." -ForegroundColor Yellow
git status

# Stash any uncommitted changes
Write-Host "Stashing any uncommitted changes..." -ForegroundColor Yellow
git stash push -m "Auto-stash before main merge"

# Fetch latest changes from remote
Write-Host "Fetching latest changes from remote..." -ForegroundColor Yellow
git fetch origin

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Green

# Switch to dev branch if not already on it
if ($currentBranch -ne "dev") {
    Write-Host "Switching to dev branch..." -ForegroundColor Yellow
    git checkout dev
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to switch to dev branch. Creating dev branch..." -ForegroundColor Red
        git checkout -b dev
    }
}

# Pull latest dev changes
Write-Host "Pulling latest dev branch changes..." -ForegroundColor Yellow
git pull origin dev

# Merge main branch into dev
Write-Host "Merging main branch into dev..." -ForegroundColor Yellow
git merge origin/main --no-ff -m "Merge main branch into dev"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully merged main into dev!" -ForegroundColor Green
    
    # Show merge summary
    Write-Host "Merge Summary:" -ForegroundColor Cyan
    git log --oneline -10
    
    # Push merged changes to remote dev branch
    Write-Host "Pushing merged changes to remote dev branch..." -ForegroundColor Yellow
    git push origin dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully pushed merged dev branch to remote!" -ForegroundColor Green
    } else {
        Write-Host "Failed to push to remote. You may need to push manually." -ForegroundColor Yellow
    }
    
} else {
    Write-Host "Merge conflicts detected!" -ForegroundColor Red
    Write-Host "Please resolve conflicts manually:" -ForegroundColor Yellow
    Write-Host "   1. Edit conflicted files" -ForegroundColor White
    Write-Host "   2. Run: git add <resolved-files>" -ForegroundColor White
    Write-Host "   3. Run: git commit" -ForegroundColor White
    Write-Host "   4. Run: git push origin dev" -ForegroundColor White
    
    # Show conflicted files
    Write-Host "Conflicted files:" -ForegroundColor Red
    git diff --name-only --diff-filter=U
}

# Restore stashed changes if any
$stashList = git stash list
if ($stashList) {
    Write-Host "Restoring stashed changes..." -ForegroundColor Yellow
    git stash pop
}

Write-Host "Main to Dev merge process completed!" -ForegroundColor Cyan