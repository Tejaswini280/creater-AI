# Railway Quick Start Script
# One-command setup for Railway deployment

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Railway Deployment Quick Start" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Railway CLI
Write-Host "[1/3] Checking Railway CLI..." -ForegroundColor Yellow
$railwayExists = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayExists) {
    Write-Host "  Installing Railway CLI..." -ForegroundColor Cyan
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Failed to install Railway CLI" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Railway CLI ready" -ForegroundColor Green
Write-Host ""

# Step 2: Authenticate
Write-Host "[2/3] Checking authentication..." -ForegroundColor Yellow
$whoami = railway whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "  Not authenticated. Opening browser..." -ForegroundColor Cyan
    railway login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Authentication failed" -ForegroundColor Red
        Write-Host ""
        Write-Host "  Please run: .\fix-railway-auth.ps1" -ForegroundColor Yellow
        exit 1
    }
}

$whoami = railway whoami 2>&1
Write-Host "  Authenticated as: $whoami" -ForegroundColor Green
Write-Host ""

# Step 3: Verify setup
Write-Host "[3/3] Verifying setup..." -ForegroundColor Yellow

$checks = @{
    "Railway CLI" = (Get-Command railway -ErrorAction SilentlyContinue) -ne $null
    "Authenticated" = (railway whoami 2>&1; $LASTEXITCODE -eq 0)
    "package.json" = Test-Path "package.json"
    ".env.staging" = Test-Path ".env.staging"
}

$allPassed = $true
foreach ($check in $checks.GetEnumerator()) {
    if ($check.Value) {
        Write-Host "  $($check.Key): OK" -ForegroundColor Green
    } else {
        Write-Host "  $($check.Key): Missing" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "  Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ready to deploy! Choose an option:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Manual deployment:" -ForegroundColor Cyan
    Write-Host "    .\deploy-railway-staging-auth-fix.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "  Automated deployment:" -ForegroundColor Cyan
    Write-Host "    git push origin dev" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "  Setup Incomplete" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please fix the issues above" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For help, read: START_HERE.md" -ForegroundColor Cyan
    Write-Host ""
}
