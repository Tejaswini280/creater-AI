# Push Railway Authentication Fixes to Dev Branch
# Commits and pushes all Railway authentication fixes

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Push Railway Auth Fixes to Dev" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is available
$gitExists = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitExists) {
    Write-Host "Git not found. Please install Git first." -ForegroundColor Red
    exit 1
}

# Check current branch
Write-Host "Checking current branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current

Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan
Write-Host ""

# Add all Railway authentication fix files
Write-Host "Adding Railway authentication fix files..." -ForegroundColor Yellow

$filesToAdd = @(
    "fix-railway-auth.ps1",
    "deploy-railway-staging-auth-fix.ps1",
    "test-railway-setup.ps1",
    "test-railway-token.ps1",
    "railway-quick-start.ps1",
    "scripts/deploy/setup.ps1",
    ".github/workflows/staging-deploy.yml",
    "RAILWAY_AUTH_TROUBLESHOOTING.md",
    "RAILWAY_DEPLOYMENT_FIX.md",
    "RAILWAY_AUTH_FIX_SUMMARY.md",
    "DEPLOYMENT_COMPLETE_GUIDE.md",
    "GITHUB_SECRETS_QUICK_SETUP.md",
    "START_HERE.md",
    "FIXED_SYNTAX_ERROR.md",
    "RAILWAY_DEPLOYMENT_README.md"
)

foreach ($file in $filesToAdd) {
    if (Test-Path $file) {
        git add $file
        Write-Host "  Added: $file" -ForegroundColor Green
    } else {
        Write-Host "  Skipped (not found): $file" -ForegroundColor Yellow
    }
}

Write-Host ""

# Check if there are changes to commit
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
$commitMessage = "Fix Railway authentication and deployment issues

- Add PowerShell scripts for Windows compatibility
- Fix authentication flow with browser and token options
- Update GitHub Actions workflow with correct Railway IDs
- Add comprehensive documentation and troubleshooting guides
- Update project IDs to match actual Railway configuration"

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "Changes committed" -ForegroundColor Green
Write-Host ""

# Push to dev branch
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow

if ($currentBranch -eq "dev") {
    Write-Host "Already on dev branch, pushing..." -ForegroundColor Cyan
    git push origin dev
} else {
    Write-Host "Current branch is '$currentBranch'" -ForegroundColor Cyan
    $response = Read-Host "Switch to dev branch and push? (Y/n)"
    
    if ($response -eq 'n' -or $response -eq 'N') {
        Write-Host "Cancelled" -ForegroundColor Yellow
        exit 0
    }
    
    # Switch to dev branch
    Write-Host "Switching to dev branch..." -ForegroundColor Yellow
    git checkout dev
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to switch to dev branch" -ForegroundColor Red
        Write-Host "Creating dev branch..." -ForegroundColor Yellow
        git checkout -b dev
    }
    
    # Merge changes
    Write-Host "Merging changes from $currentBranch..." -ForegroundColor Yellow
    git merge $currentBranch --no-edit
    
    # Push to dev
    Write-Host "Pushing to dev..." -ForegroundColor Yellow
    git push origin dev
}

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Successfully Pushed to Dev!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Changes pushed to dev branch" -ForegroundColor Green
    Write-Host ""
    Write-Host "GitHub Actions will now:" -ForegroundColor Yellow
    Write-Host "  1. Run tests" -ForegroundColor White
    Write-Host "  2. Build the application" -ForegroundColor White
    Write-Host "  3. Deploy to Railway staging" -ForegroundColor White
    Write-Host ""
    Write-Host "Monitor deployment:" -ForegroundColor Yellow
    Write-Host "  GitHub: https://github.com/your-repo/actions" -ForegroundColor Cyan
    Write-Host "  Railway: https://railway.app/project/711091cc-10bf-41a3-87cf-8d058419de4f" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Push failed" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
