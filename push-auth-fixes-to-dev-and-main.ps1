#!/usr/bin/env pwsh

# =============================================================================
# Docker Authentication Fixes - Push to Dev and Merge to Main
# =============================================================================

Write-Host "🔧 Docker Authentication Fixes - Git Workflow" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Function to check git status
function Check-GitStatus {
    $status = git status --porcelain
    if ($status) {
        Write-Host "📝 Uncommitted changes detected:" -ForegroundColor Yellow
        git status --short
        return $true
    }
    return $false
}

# Function to safely switch branches
function Switch-Branch {
    param($BranchName)
    
    Write-Host "🔄 Switching to branch: $BranchName" -ForegroundColor Blue
    
    # Check if branch exists locally
    $branchExists = git branch --list $BranchName
    if (-not $branchExists) {
        # Check if branch exists on remote
        $remoteBranchExists = git branch -r --list "origin/$BranchName"
        if ($remoteBranchExists) {
            Write-Host "📥 Creating local branch from remote: $BranchName" -ForegroundColor Yellow
            git checkout -b $BranchName origin/$BranchName
        } else {
            Write-Host "🆕 Creating new branch: $BranchName" -ForegroundColor Yellow
            git checkout -b $BranchName
        }
    } else {
        git checkout $BranchName
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to switch to branch: $BranchName" -ForegroundColor Red
        exit 1
    }
}

# Function to commit changes
function Commit-Changes {
    param($Message)
    
    Write-Host "📝 Staging changes..." -ForegroundColor Blue
    git add .
    
    Write-Host "💾 Committing changes..." -ForegroundColor Blue
    git commit -m $Message
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to commit changes" -ForegroundColor Red
        exit 1
    }
}

# Function to push changes
function Push-Changes {
    param($BranchName)
    
    Write-Host "🚀 Pushing changes to origin/$BranchName..." -ForegroundColor Blue
    git push origin $BranchName
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to push changes to $BranchName" -ForegroundColor Red
        exit 1
    }
}

# Function to merge branches
function Merge-Branch {
    param($SourceBranch, $TargetBranch)
    
    Write-Host "🔀 Merging $SourceBranch into $TargetBranch..." -ForegroundColor Blue
    
    # Switch to target branch
    Switch-Branch $TargetBranch
    
    # Pull latest changes
    Write-Host "📥 Pulling latest changes for $TargetBranch..." -ForegroundColor Blue
    git pull origin $TargetBranch
    
    # Merge source branch
    $mergeMessage = "Merge ${SourceBranch}: Docker authentication fixes"
    git merge $SourceBranch --no-ff -m $mergeMessage
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to merge $SourceBranch into $TargetBranch" -ForegroundColor Red
        Write-Host "🔧 Please resolve conflicts manually and run:" -ForegroundColor Yellow
        Write-Host "   git add ." -ForegroundColor Yellow
        Write-Host "   git commit" -ForegroundColor Yellow
        Write-Host "   git push origin $TargetBranch" -ForegroundColor Yellow
        exit 1
    }
    
    # Push merged changes
    Push-Changes $TargetBranch
}

# Main execution
try {
    Write-Host "🔍 Checking current git status..." -ForegroundColor Blue
    
    # Get current branch
    $currentBranch = git branch --show-current
    Write-Host "📍 Current branch: $currentBranch" -ForegroundColor Green
    
    # Check for uncommitted changes
    if (Check-GitStatus) {
        Write-Host "💾 Committing authentication fixes..." -ForegroundColor Blue
        
        # Create comprehensive commit message
        $commitMessage = "Fix Docker authentication redirect loop - Backend cookie configuration fixed - Frontend auth state management improved - WebSocket authentication enhanced - Docker configuration updated"

        Commit-Changes $commitMessage
    }
    
    # Step 1: Push to dev branch
    Write-Host "`n🎯 Step 1: Pushing changes to dev branch" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    
    if ($currentBranch -ne "dev") {
        Switch-Branch "dev"
        
        # If we switched from another branch, merge the changes
        if ($currentBranch -ne "dev") {
            Write-Host "🔀 Merging changes from $currentBranch to dev..." -ForegroundColor Blue
            $mergeMsg = "Merge authentication fixes from $currentBranch"
            git merge $currentBranch --no-ff -m $mergeMsg
            
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ Failed to merge changes to dev" -ForegroundColor Red
                exit 1
            }
        }
    }
    
    # Push dev branch
    Push-Changes "dev"
    Write-Host "✅ Successfully pushed authentication fixes to dev branch!" -ForegroundColor Green
    
    # Step 2: Merge dev into main
    Write-Host "`n🎯 Step 2: Merging dev into main branch" -ForegroundColor Magenta
    Write-Host "======================================" -ForegroundColor Magenta
    
    Merge-Branch "dev" "main"
    Write-Host "✅ Successfully merged dev into main branch!" -ForegroundColor Green
    
    # Step 3: Summary and next steps
    Write-Host "`n🎉 Git Workflow Complete!" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    Write-Host "✅ Changes committed with comprehensive message" -ForegroundColor Green
    Write-Host "✅ Pushed authentication fixes to dev branch" -ForegroundColor Green
    Write-Host "✅ Merged dev branch into main branch" -ForegroundColor Green
    Write-Host "✅ All changes are now in both dev and main branches" -ForegroundColor Green
    
    Write-Host "`n📋 Summary of Changes:" -ForegroundColor Cyan
    Write-Host "- server/routes.ts: Fixed cookie sameSite policy" -ForegroundColor White
    Write-Host "- server/middleware/security.ts: Enhanced CORS origins" -ForegroundColor White
    Write-Host "- client/src/hooks/useAuth.ts: Improved auth state management" -ForegroundColor White
    Write-Host "- server/websocket.ts: Enhanced WebSocket authentication" -ForegroundColor White
    Write-Host "- docker-compose.yml: Updated to use development environment" -ForegroundColor White
    Write-Host "- .env.development: Enhanced Docker compatibility" -ForegroundColor White
    
    Write-Host "`n🚀 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Test the Docker authentication fix:" -ForegroundColor White
    Write-Host "   docker-compose down && docker-compose build --no-cache && docker-compose up" -ForegroundColor Gray
    Write-Host "2. Verify login flow works without redirect loops" -ForegroundColor White
    Write-Host "3. Check WebSocket connections are stable" -ForegroundColor White
    Write-Host "4. Deploy to staging/production when ready" -ForegroundColor White
    
    # Return to original branch if it wasn't dev or main
    if ($currentBranch -ne "dev" -and $currentBranch -ne "main") {
        Write-Host "`n🔄 Returning to original branch: $currentBranch" -ForegroundColor Blue
        Switch-Branch $currentBranch
    }
    
} catch {
    Write-Host "❌ Error occurred during git workflow: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎯 Docker Authentication Fixes Successfully Deployed!" -ForegroundColor Green