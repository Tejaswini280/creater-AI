# Push Docker TypeScript Build Fix to Dev Branch

Write-Host "🚀 Pushing Docker TypeScript Build Fix to Dev Branch..." -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Cyan

# Add all changes
Write-Host "📦 Adding all changes..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$status = git status --porcelain
if ([string]::IsNullOrEmpty($status)) {
    Write-Host "ℹ️ No changes to commit" -ForegroundColor Yellow
} else {
    # Commit changes
    Write-Host "💾 Committing Docker TypeScript build fix..." -ForegroundColor Yellow
    git commit -m "fix: Docker build TypeScript compilation issues - Created server/tsconfig.json - Modified build scripts - Updated Dockerfile for tsx execution"
}

# Switch to dev branch or create it
Write-Host "🔄 Switching to dev branch..." -ForegroundColor Yellow
$devExists = git branch --list dev
if ($devExists) {
    git checkout dev
    Write-Host "✅ Switched to existing dev branch" -ForegroundColor Green
} else {
    git checkout -b dev
    Write-Host "✅ Created and switched to new dev branch" -ForegroundColor Green
}

# Merge changes from previous branch if different
if ($currentBranch -ne "dev") {
    Write-Host "🔀 Merging changes from $currentBranch..." -ForegroundColor Yellow
    git merge $currentBranch --no-ff -m "merge: Docker TypeScript build fix from $currentBranch"
}

# Push to remote dev branch
Write-Host "⬆️ Pushing to remote dev branch..." -ForegroundColor Yellow
try {
    git push origin dev
    Write-Host "✅ Successfully pushed to origin/dev" -ForegroundColor Green
} catch {
    Write-Host "🔗 Setting upstream and pushing..." -ForegroundColor Yellow
    git push --set-upstream origin dev
    Write-Host "✅ Successfully pushed to origin/dev with upstream" -ForegroundColor Green
}

Write-Host "🎉 Docker TypeScript build fix successfully pushed to dev branch!" -ForegroundColor Green