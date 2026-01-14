# Push Database Migration Fix Spec to Dev Branch
# This script commits and pushes the database migration fix specification to the dev branch

Write-Host "🚀 PUSHING DATABASE MIGRATION FIX SPEC TO DEV BRANCH" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    exit 1
}

# Add the spec files
Write-Host "📁 Adding spec files to git..." -ForegroundColor Yellow
git add .kiro/specs/database-migration-fix/

# Check if there are changes to commit
$status = git status --porcelain .kiro/specs/database-migration-fix/
if (-not $status) {
    Write-Host "ℹ️  No changes to commit in spec files" -ForegroundColor Blue
    Write-Host "✅ Spec files are already up to date" -ForegroundColor Green
    exit 0
}

# Show what will be committed
Write-Host "📋 Files to be committed:" -ForegroundColor Cyan
git status --porcelain .kiro/specs/database-migration-fix/

# Commit the changes
$commitMessage = "feat: Add database migration fix specification

- Add comprehensive requirements for migration dependency resolution
- Add design with 4 main components: dependency resolver, schema validator, recovery manager, enhanced executor
- Add 8 correctness properties for property-based testing
- Add implementation tasks focused on immediate fix and long-term solution
- Addresses 502 error caused by missing project_id column references in migrations

Fixes: Migration failure 'column project_id does not exist'
Spec: database-migration-fix"

Write-Host "💾 Committing spec files..." -ForegroundColor Yellow
git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Get current branch
$currentBranch = git branch --show-current

# Switch to dev branch if not already on it
if ($currentBranch -ne "dev") {
    Write-Host "🔄 Switching to dev branch..." -ForegroundColor Yellow
    git checkout dev
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to switch to dev branch" -ForegroundColor Red
        Write-Host "ℹ️  Creating dev branch..." -ForegroundColor Blue
        git checkout -b dev
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to create dev branch" -ForegroundColor Red
            exit 1
        }
    }
}

# Merge the commit from the previous branch if we switched
if ($currentBranch -ne "dev") {
    Write-Host "🔄 Merging changes from $currentBranch..." -ForegroundColor Yellow
    git merge $currentBranch --no-ff -m "Merge database migration fix spec from $currentBranch"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to merge changes" -ForegroundColor Red
        exit 1
    }
}

# Push to dev branch
Write-Host "⬆️  Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push to dev branch" -ForegroundColor Red
    Write-Host "ℹ️  Trying to set upstream..." -ForegroundColor Blue
    git push --set-upstream origin dev
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to push with upstream" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ DATABASE MIGRATION FIX SPEC PUSHED TO DEV SUCCESSFULLY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "📁 Spec Location: .kiro/specs/database-migration-fix/" -ForegroundColor Cyan
Write-Host "📋 Files Pushed:" -ForegroundColor Cyan
Write-Host "   • requirements.md - 6 key requirements for migration fixes" -ForegroundColor White
Write-Host "   • design.md - Architecture with 4 components + 8 correctness properties" -ForegroundColor White
Write-Host "   • tasks.md - 9 implementation tasks (fast MVP approach)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Open .kiro/specs/database-migration-fix/tasks.md" -ForegroundColor White
Write-Host "   2. Click 'Start task' on Task 7 (immediate fix) for fastest resolution" -ForegroundColor White
Write-Host "   3. Or start with Task 1 for comprehensive solution" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Immediate Fix Available:" -ForegroundColor Magenta
Write-Host "   • Task 7 addresses your specific project_id column issue" -ForegroundColor White
Write-Host "   • Should resolve the 502 error and get your app running" -ForegroundColor White
Write-Host ""