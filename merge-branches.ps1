# Merge all code from tk_creator-AI to tk-final-Creator-AI
Write-Host "🔄 Merging tk_creator-AI branch into tk-final-Creator-AI" -ForegroundColor Green

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Cyan

# Ensure we're on tk-final-Creator-AI
if ($currentBranch -ne "tk-final-Creator-AI") {
    Write-Host "⚠️  Switching to tk-final-Creator-AI branch..." -ForegroundColor Yellow
    git checkout tk-final-Creator-AI
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to switch to tk-final-Creator-AI branch" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ On tk-final-Creator-AI branch" -ForegroundColor Green

# Check if tk_creator-AI branch exists
$branchExists = git branch --list tk_creator-AI
if (-not $branchExists) {
    Write-Host "❌ Branch tk_creator-AI does not exist" -ForegroundColor Red
    Write-Host "Available branches:" -ForegroundColor Yellow
    git branch -a
    exit 1
}

Write-Host "✅ tk_creator-AI branch found" -ForegroundColor Green

# Show current status before merge
Write-Host "`n📊 Current status before merge:" -ForegroundColor Cyan
git status --short

# Merge tk_creator-AI into tk-final-Creator-AI
Write-Host "`n🔄 Merging tk_creator-AI branch..." -ForegroundColor Yellow
git merge tk_creator-AI --no-ff -m "merge: Integrate all code from tk_creator-AI into tk-final-Creator-AI - Merging complete application codebase - Including all features and fixes - Preserving development history"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Merge completed successfully!" -ForegroundColor Green
    
    # Show merge result
    Write-Host "`n📊 Post-merge status:" -ForegroundColor Cyan
    git status --short
    
    # Show recent commits
    Write-Host "`n📝 Recent commits:" -ForegroundColor Cyan
    git log --oneline -10
    
    # Add any remaining untracked files
    Write-Host "`n📦 Adding any new files..." -ForegroundColor Yellow
    git add .
    
    # Check if there are changes to commit
    $changes = git status --porcelain
    if ($changes) {
        Write-Host "Committing additional changes..." -ForegroundColor Yellow
        git commit -m "feat: Add remaining files after merge from tk_creator-AI - Include all untracked files - Ensure complete application is in tk-final-Creator-AI - Ready for deployment"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Additional changes committed" -ForegroundColor Green
        }
    } else {
        Write-Host "No additional changes to commit" -ForegroundColor Green
    }
    
    Write-Host "`n🎉 SUCCESS! All code from tk_creator-AI is now in tk-final-Creator-AI" -ForegroundColor Green
    
    Write-Host "`n📋 MERGE SUMMARY:" -ForegroundColor Cyan
    Write-Host "✅ Source branch: tk_creator-AI" -ForegroundColor White
    Write-Host "✅ Target branch: tk-final-Creator-AI" -ForegroundColor White
    Write-Host "✅ Merge type: No fast-forward (preserves history)" -ForegroundColor White
    Write-Host "✅ All files included" -ForegroundColor White
    
    Write-Host "`n🚀 READY TO PUSH:" -ForegroundColor Yellow
    Write-Host "Run: git push origin tk-final-Creator-AI" -ForegroundColor White
    Write-Host "Or use: .\push-to-branch.ps1" -ForegroundColor White
    
} else {
    Write-Host "❌ Merge failed - there may be conflicts to resolve" -ForegroundColor Red
    Write-Host "`n🔧 To resolve conflicts:" -ForegroundColor Yellow
    Write-Host "1. Check git status to see conflicted files" -ForegroundColor White
    Write-Host "2. Edit conflicted files to resolve conflicts" -ForegroundColor White
    Write-Host "3. Run: git add resolved-files" -ForegroundColor White
    Write-Host "4. Run: git commit" -ForegroundColor White
    
    Write-Host "`n📊 Current status:" -ForegroundColor Cyan
    git status
}

Write-Host "`n📁 Current branch content:" -ForegroundColor Cyan
$fileCount = (Get-ChildItem -Recurse -File | Measure-Object).Count
Write-Host "Total files: $fileCount" -ForegroundColor White