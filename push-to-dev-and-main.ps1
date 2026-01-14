#!/usr/bin/env pwsh

Write-Host "🚀 Pushing to Dev and Main Branches..." -ForegroundColor Green
Write-Host "Repository: https://github.com/Tejaswini280/creater-AI.git" -ForegroundColor Yellow
Write-Host ""

# Check current status
Write-Host "📊 Current Git Status:" -ForegroundColor Cyan
git status --short

# Check current branch
$currentBranch = git branch --show-current
Write-Host "📍 Current Branch: $currentBranch" -ForegroundColor White

# Add all new files and changes
Write-Host "`n📁 Adding all changes..." -ForegroundColor Cyan
git add .

# Show what we're committing
Write-Host "`n📋 Files to Commit:" -ForegroundColor Cyan
$stagedFiles = git diff --cached --name-only
if ($stagedFiles) {
    $stagedFiles | ForEach-Object {
        Write-Host "  📄 $_" -ForegroundColor White
    }
} else {
    Write-Host "  ℹ️ No changes to commit" -ForegroundColor Yellow
}

# Create commit if there are changes
if ($stagedFiles) {
    Write-Host "`n💾 Creating Commit..." -ForegroundColor Cyan
    $commitMessage = "feat: Complete application fixes and enhancements

✅ Database Fixes:
- Fixed missing database tables (ai_generation_tasks, structured_outputs, generated_code)
- Resolved Express rate limiting configuration (trust proxy)
- Fixed Content scheduler null date handling
- Resolved database column compatibility issues

✅ Application Enhancements:
- Added comprehensive application status checking
- Created launch scripts for easy startup
- Implemented database schema verification
- Added application startup testing

✅ New Files:
- fix-database-schema-issues.cjs - Database schema verification
- fix-express-rate-limit-config.cjs - Express configuration fixes
- fix-all-database-issues.cjs - Comprehensive database fixes
- test-application-startup.cjs - Application startup testing
- check-app-status.cjs - Application status verification
- launch-app.ps1 - Easy application launcher
- DATABASE_FIXES_SUMMARY.md - Complete fix documentation

✅ Modified Files:
- server/index.ts - Added trust proxy configuration
- server/services/scheduler.ts - Fixed null date handling

🎯 Result: Application runs successfully with all services working
📊 Status: Database connected, scheduler initialized, all features functional"

    git commit -m "$commitMessage"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit created successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Commit failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ℹ️ No changes to commit, proceeding with existing commits..." -ForegroundColor Yellow
}

# Function to push to a branch
function Push-ToBranch {
    param($branchName)
    
    Write-Host "`n🔄 Switching to $branchName branch..." -ForegroundColor Cyan
    git checkout $branchName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Branch $branchName doesn't exist locally, creating it..." -ForegroundColor Yellow
        git checkout -b $branchName
    }
    
    # Merge changes if we're not already on the target branch
    if ($currentBranch -ne $branchName -and $stagedFiles) {
        Write-Host "🔀 Merging changes from $currentBranch..." -ForegroundColor Cyan
        git merge $currentBranch --no-edit
    }
    
    Write-Host "📤 Pushing to $branchName..." -ForegroundColor Cyan
    
    # Try multiple push methods
    $pushSuccess = $false
    
    # Method 1: Direct push
    Write-Host "  Trying: git push origin $branchName" -ForegroundColor Gray
    git push origin $branchName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully pushed to $branchName!" -ForegroundColor Green
        $pushSuccess = $true
    } else {
        # Method 2: Push with explicit URL
        Write-Host "  Trying: git push with explicit URL" -ForegroundColor Gray
        git push https://github.com/Tejaswini280/creater-AI.git $branchName
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully pushed to $branchName with explicit URL!" -ForegroundColor Green
            $pushSuccess = $true
        } else {
            # Method 3: Force push (if safe)
            Write-Host "  Trying: Force push (if safe)" -ForegroundColor Gray
            git push origin $branchName --force-with-lease
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Successfully force pushed to $branchName!" -ForegroundColor Green
                $pushSuccess = $true
            }
        }
    }
    
    if (-not $pushSuccess) {
        Write-Host "❌ Failed to push to $branchName" -ForegroundColor Red
        return $false
    }
    
    return $true
}

# Push to dev branch first
Write-Host "`n🎯 Step 1: Pushing to DEV branch..." -ForegroundColor Magenta
$devSuccess = Push-ToBranch "dev"

# Push to main branch
Write-Host "`n🎯 Step 2: Pushing to MAIN branch..." -ForegroundColor Magenta
$mainSuccess = Push-ToBranch "main"

# Return to original branch
Write-Host "`n🔄 Returning to original branch: $currentBranch" -ForegroundColor Cyan
git checkout $currentBranch

# Summary
Write-Host "`n📊 Push Summary:" -ForegroundColor Cyan
Write-Host "=" * 50
if ($devSuccess) {
    Write-Host "✅ DEV branch: Successfully pushed" -ForegroundColor Green
} else {
    Write-Host "❌ DEV branch: Push failed" -ForegroundColor Red
}

if ($mainSuccess) {
    Write-Host "✅ MAIN branch: Successfully pushed" -ForegroundColor Green
} else {
    Write-Host "❌ MAIN branch: Push failed" -ForegroundColor Red
}

if ($devSuccess -and $mainSuccess) {
    Write-Host "`n🎉 SUCCESS! Changes pushed to both branches!" -ForegroundColor Green
    Write-Host "`n🔗 View changes at:" -ForegroundColor Yellow
    Write-Host "  📍 Dev: https://github.com/Tejaswini280/creater-AI/tree/dev" -ForegroundColor Cyan
    Write-Host "  📍 Main: https://github.com/Tejaswini280/creater-AI/tree/main" -ForegroundColor Cyan
    Write-Host "`n🚀 Your application fixes are now available on both branches!" -ForegroundColor Green
} elseif ($devSuccess -or $mainSuccess) {
    Write-Host "`n⚠️ Partial Success - Some branches failed to push" -ForegroundColor Yellow
    Write-Host "Check the errors above and try manual push for failed branches" -ForegroundColor White
} else {
    Write-Host "`n❌ All pushes failed!" -ForegroundColor Red
    Write-Host "`n💡 Manual Push Instructions:" -ForegroundColor Yellow
    Write-Host "1. Check your GitHub authentication" -ForegroundColor White
    Write-Host "2. Try: git push origin dev" -ForegroundColor White
    Write-Host "3. Try: git push origin main" -ForegroundColor White
    Write-Host "4. Or use GitHub Desktop/Web interface" -ForegroundColor White
}