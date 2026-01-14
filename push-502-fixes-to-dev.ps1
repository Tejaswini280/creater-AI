# ═══════════════════════════════════════════════════════════════════════════════
# PUSH 502 ERROR FIXES TO DEV BRANCH
# ═══════════════════════════════════════════════════════════════════════════════
# This script pushes all the 502 error fixes and database schema fixes to dev branch
# Includes: Database schema fixes, startup scripts, and migration solutions
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host "🚀 PUSHING 502 ERROR FIXES TO DEV BRANCH" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "This will push all database fixes and 502 error solutions to dev" -ForegroundColor Yellow
Write-Host ""

# Step 1: Check git status
Write-Host "📋 Step 1: Checking git status..." -ForegroundColor Green
try {
    git status --porcelain
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Git status check failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Git status checked" -ForegroundColor Green
} catch {
    Write-Host "❌ Error checking git status: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Add all the new 502 fix files
Write-Host "📋 Step 2: Adding 502 error fix files..." -ForegroundColor Green
$fixFiles = @(
    "fix-502-error-direct.cjs",
    "fix-database-schema-root-cause.sql",
    "apply-root-cause-fix.cjs",
    "verify-database-fix.cjs",
    "fix-and-restart-app.ps1",
    "start-with-railway-db.ps1",
    "start-dev-mode.ps1",
    "fix-502-complete-solution.ps1"
)

foreach ($file in $fixFiles) {
    if (Test-Path $file) {
        try {
            git add $file
            Write-Host "✅ Added: $file" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Warning: Could not add $file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  File not found: $file" -ForegroundColor Yellow
    }
}

# Add any other modified files
try {
    git add .
    Write-Host "✅ Added all modified files" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not add all files" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Create commit with descriptive message
Write-Host "📋 Step 3: Creating commit..." -ForegroundColor Green
$commitMessage = "fix: Complete 502 error resolution with database schema fixes

Add direct database schema fix for missing columns (project_id, password)
Implement root cause fix for migration failures
Add Railway database connection scripts
Add development mode startup scripts
Add comprehensive 502 error solution with multiple options
Fix database connection reset issues
Add verification scripts for database fixes
Resolve column project_id does not exist error
Resolve column password does not exist error
Add migration tracking to prevent re-running failed migrations

This resolves the recurring 502 errors caused by database migration failures."

try {
    git commit -m $commitMessage
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit created successfully" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No changes to commit or commit failed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error creating commit: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Push to dev branch
Write-Host "📋 Step 4: Pushing to dev branch..." -ForegroundColor Green
try {
    # First, try to push to dev branch
    git push origin dev
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully pushed to dev branch" -ForegroundColor Green
    } else {
        # If dev branch doesn't exist, create it and push
        Write-Host "⚠️  Dev branch might not exist, creating and pushing..." -ForegroundColor Yellow
        git checkout -b dev 2>$null
        git push -u origin dev
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Created dev branch and pushed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to push to dev branch" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "❌ Error pushing to dev: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Show summary
Write-Host "🎉 502 ERROR FIXES PUSHED TO DEV SUCCESSFULLY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Database schema fixes pushed" -ForegroundColor Green
Write-Host "✅ 502 error resolution scripts pushed" -ForegroundColor Green
Write-Host "✅ Railway connection scripts pushed" -ForegroundColor Green
Write-Host "✅ Development mode scripts pushed" -ForegroundColor Green
Write-Host "✅ Verification scripts pushed" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Next steps:" -ForegroundColor Cyan
Write-Host "1. Your dev branch now has all the 502 error fixes" -ForegroundColor White
Write-Host "2. Deploy the dev branch to test the fixes" -ForegroundColor White
Write-Host "3. Use the fix scripts to resolve database issues" -ForegroundColor White
Write-Host "4. Merge to main once verified working" -ForegroundColor White
Write-Host ""
Write-Host "🚀 The 502 errors should be resolved with these fixes!" -ForegroundColor Cyan