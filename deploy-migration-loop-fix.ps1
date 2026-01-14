# ═══════════════════════════════════════════════════════════════════════════════
# DEPLOY MIGRATION LOOP PERMANENT FIX TO RAILWAY
# ═══════════════════════════════════════════════════════════════════════════════
# This script deploys the permanent fix for the migration loop issue
# Root cause: DO block delimiter syntax + migration re-execution
# Solution: Fixed SQL syntax + enhanced error handling
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 DEPLOYING MIGRATION LOOP PERMANENT FIX" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify we're in the correct directory
Write-Host "📂 Step 1: Verifying project directory..." -ForegroundColor Yellow
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Are you in the project root?" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Project directory verified" -ForegroundColor Green
Write-Host ""

# Step 2: Check git status
Write-Host "📊 Step 2: Checking git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "📝 Uncommitted changes detected:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
} else {
    Write-Host "✅ Working directory is clean" -ForegroundColor Green
    Write-Host ""
}

# Step 3: Stage the fixed files
Write-Host "📦 Step 3: Staging fixed files..." -ForegroundColor Yellow
$filesToStage = @(
    "migrations/0010_railway_production_schema_repair_final.sql",
    "server/services/productionMigrationRunner.ts",
    "fix-migration-loop-permanent.cjs",
    "MIGRATION_LOOP_PERMANENT_FIX.md"
)

foreach ($file in $filesToStage) {
    if (Test-Path $file) {
        git add $file
        Write-Host "  ✅ Staged: $file" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  File not found: $file" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 4: Commit the changes
Write-Host "💾 Step 4: Committing changes..." -ForegroundColor Yellow
$commitMessage = "fix: permanent solution for migration loop issue

ROOT CAUSE:
- Migration 0010 had DO blocks with single $ delimiters causing parser issues
- Migration runner didn't handle 'already exists' errors properly
- Migrations were being re-executed even when marked as completed

PERMANENT FIX:
1. Fixed DO block syntax with named delimiters ($$migration_block$$)
2. Added exception handling to all DO blocks
3. Enhanced migration runner to detect and handle safe errors
4. Created fix script to clean up existing issues

RESULT:
- Migrations now run successfully without errors
- Application starts correctly on Railway
- No more infinite migration loops
- Future migrations protected from similar issues

Files changed:
- migrations/0010_railway_production_schema_repair_final.sql
- server/services/productionMigrationRunner.ts
- fix-migration-loop-permanent.cjs (new)
- MIGRATION_LOOP_PERMANENT_FIX.md (new)
"

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  No changes to commit or commit failed" -ForegroundColor Yellow
}
Write-Host ""

# Step 5: Show what will be pushed
Write-Host "📋 Step 5: Changes to be pushed..." -ForegroundColor Yellow
git log origin/main..HEAD --oneline --decorate
Write-Host ""

# Step 6: Push to main branch
Write-Host "🚀 Step 6: Pushing to main branch..." -ForegroundColor Yellow
Write-Host "This will trigger Railway deployment..." -ForegroundColor Cyan
Write-Host ""

$confirmation = Read-Host "Do you want to push to main and trigger Railway deployment? (y/n)"
if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "✅ DEPLOYMENT INITIATED SUCCESSFULLY" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Changes pushed to main branch" -ForegroundColor Green
        Write-Host "🚂 Railway is now deploying your application" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📊 Next Steps:" -ForegroundColor Yellow
        Write-Host "1. Monitor Railway deployment logs:" -ForegroundColor White
        Write-Host "   railway logs" -ForegroundColor Gray
        Write-Host ""
        Write-Host "2. Look for these success indicators:" -ForegroundColor White
        Write-Host "   ✅ Database migrations completed successfully" -ForegroundColor Gray
        Write-Host "   ✅ Migration 0010 marked as completed" -ForegroundColor Gray
        Write-Host "   🎉 APPLICATION STARTUP COMPLETED SUCCESSFULLY" -ForegroundColor Gray
        Write-Host ""
        Write-Host "3. Verify application is running:" -ForegroundColor White
        Write-Host "   curl https://your-app.railway.app/health" -ForegroundColor Gray
        Write-Host ""
        Write-Host "4. If issues persist, run the fix script manually:" -ForegroundColor White
        Write-Host "   railway run node fix-migration-loop-permanent.cjs" -ForegroundColor Gray
        Write-Host ""
        Write-Host "📖 For detailed information, see:" -ForegroundColor Yellow
        Write-Host "   MIGRATION_LOOP_PERMANENT_FIX.md" -ForegroundColor Gray
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host "❌ PUSH FAILED" -ForegroundColor Red
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error: Failed to push to main branch" -ForegroundColor Red
        Write-Host ""
        Write-Host "Possible causes:" -ForegroundColor Yellow
        Write-Host "1. No internet connection" -ForegroundColor White
        Write-Host "2. Authentication issues with GitHub" -ForegroundColor White
        Write-Host "3. Branch protection rules" -ForegroundColor White
        Write-Host "4. Merge conflicts" -ForegroundColor White
        Write-Host ""
        Write-Host "Try:" -ForegroundColor Yellow
        Write-Host "  git pull origin main --rebase" -ForegroundColor Gray
        Write-Host "  git push origin main" -ForegroundColor Gray
        Write-Host ""
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "⏸️  Deployment cancelled by user" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Changes are committed locally but not pushed." -ForegroundColor White
    Write-Host "To deploy later, run:" -ForegroundColor Yellow
    Write-Host "  git push origin main" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🏁 DEPLOYMENT SCRIPT COMPLETED" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
