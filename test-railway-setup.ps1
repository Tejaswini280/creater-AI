# Railway Setup Verification Script
# Tests all aspects of Railway configuration and authentication

Write-Host "🔍 Railway Setup Verification" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

$allPassed = $true

# Test 1: Railway CLI Installation
Write-Host "Test 1: Railway CLI Installation" -ForegroundColor Yellow
$railwayExists = Get-Command railway -ErrorAction SilentlyContinue

if ($railwayExists) {
    $version = railway --version 2>&1
    Write-Host "  ✅ Railway CLI installed: $version" -ForegroundColor Green
} else {
    Write-Host "  ❌ Railway CLI not found" -ForegroundColor Red
    Write-Host "     Install with: npm install -g @railway/cli" -ForegroundColor Yellow
    $allPassed = $false
}

Write-Host ""

# Test 2: Authentication
Write-Host "Test 2: Railway Authentication" -ForegroundColor Yellow
$whoami = railway whoami 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Authenticated as: $whoami" -ForegroundColor Green
} else {
    Write-Host "  ❌ Not authenticated" -ForegroundColor Red
    Write-Host "     Run: .\fix-railway-auth.ps1" -ForegroundColor Yellow
    $allPassed = $false
}

Write-Host ""

# Test 3: Environment Files
Write-Host "Test 3: Environment Configuration" -ForegroundColor Yellow

$envFiles = @(
    @{Name=".env"; Required=$false},
    @{Name=".env.staging"; Required=$true},
    @{Name=".env.production"; Required=$true}
)

foreach ($envFile in $envFiles) {
    if (Test-Path $envFile.Name) {
        Write-Host "  ✅ Found: $($envFile.Name)" -ForegroundColor Green
        
        # Check for Railway token
        $content = Get-Content $envFile.Name -Raw
        if ($content -match 'RAILWAY_TOKEN=') {
            Write-Host "     ℹ️  Contains RAILWAY_TOKEN" -ForegroundColor Cyan
        }
    } else {
        if ($envFile.Required) {
            Write-Host "  ❌ Missing: $($envFile.Name)" -ForegroundColor Red
            $allPassed = $false
        } else {
            Write-Host "  ⚠️  Optional file missing: $($envFile.Name)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Test 4: Railway Configuration
Write-Host "Test 4: Railway Project Configuration" -ForegroundColor Yellow

$projectId = "3ff6be5c-ffda-42e0-ab78-80d34b0c871b"
$stagingEnvId = "b0101648-5024-4c3e-bafb-8bd0ef1e124b"
$stagingServiceId = "c6fb59a7-7d9b-4e0f-9061-770c9d9e7fa3"

Write-Host "  ℹ️  Project ID: $projectId" -ForegroundColor Cyan
Write-Host "  ℹ️  Staging Environment: $stagingEnvId" -ForegroundColor Cyan
Write-Host "  ℹ️  Staging Service: $stagingServiceId" -ForegroundColor Cyan

if (Test-Path "railway.json") {
    Write-Host "  ✅ railway.json found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  railway.json not found (optional)" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: GitHub Workflow
Write-Host "Test 5: GitHub Actions Workflow" -ForegroundColor Yellow

if (Test-Path ".github/workflows/staging-deploy.yml") {
    Write-Host "  ✅ Staging deployment workflow found" -ForegroundColor Green
    
    $workflow = Get-Content ".github/workflows/staging-deploy.yml" -Raw
    
    if ($workflow -match 'RAILWAY_TOKEN') {
        Write-Host "     ✅ Uses RAILWAY_TOKEN secret" -ForegroundColor Green
    } else {
        Write-Host "     ❌ Missing RAILWAY_TOKEN configuration" -ForegroundColor Red
        $allPassed = $false
    }
    
    if ($workflow -match $projectId) {
        Write-Host "     ✅ Project ID configured" -ForegroundColor Green
    } else {
        Write-Host "     ⚠️  Project ID not found in workflow" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ❌ Staging deployment workflow not found" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Test 6: Node.js and npm
Write-Host "Test 6: Development Environment" -ForegroundColor Yellow

$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if ($nodeExists) {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ Node.js not found" -ForegroundColor Red
    $allPassed = $false
}

$npmExists = Get-Command npm -ErrorAction SilentlyContinue
if ($npmExists) {
    $npmVersion = npm --version
    Write-Host "  ✅ npm: v$npmVersion" -ForegroundColor Green
} else {
    Write-Host "  ❌ npm not found" -ForegroundColor Red
    $allPassed = $false
}

Write-Host ""

# Test 7: Project Dependencies
Write-Host "Test 7: Project Dependencies" -ForegroundColor Yellow

if (Test-Path "package.json") {
    Write-Host "  ✅ package.json found" -ForegroundColor Green
} else {
    Write-Host "  ❌ package.json not found" -ForegroundColor Red
    $allPassed = $false
}

if (Test-Path "node_modules") {
    Write-Host "  ✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  node_modules not found - run: npm install" -ForegroundColor Yellow
}

Write-Host ""

# Test 8: Deployment Scripts
Write-Host "Test 8: Deployment Scripts" -ForegroundColor Yellow

$scripts = @(
    "fix-railway-auth.ps1",
    "deploy-railway-staging-auth-fix.ps1",
    "scripts/deploy/setup.ps1"
)

foreach ($script in $scripts) {
    if (Test-Path $script) {
        Write-Host "  ✅ Found: $script" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Missing: $script" -ForegroundColor Yellow
    }
}

Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

if ($allPassed) {
    Write-Host "✅ All critical tests passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You're ready to deploy! Run:" -ForegroundColor Yellow
    Write-Host "  .\deploy-railway-staging-auth-fix.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fix the issues above, then run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick fixes:" -ForegroundColor Yellow
    Write-Host "  1. Install Railway CLI: npm install -g @railway/cli" -ForegroundColor White
    Write-Host "  2. Authenticate: .\fix-railway-auth.ps1" -ForegroundColor White
    Write-Host "  3. Install dependencies: npm install" -ForegroundColor White
    Write-Host ""
}

# Additional Information
Write-Host "Additional Resources:" -ForegroundColor Cyan
Write-Host "  📖 Railway Auth Guide: .\RAILWAY_AUTH_TROUBLESHOOTING.md" -ForegroundColor White
Write-Host "  📖 Deployment Fix: .\RAILWAY_DEPLOYMENT_FIX.md" -ForegroundColor White
Write-Host "  📖 GitHub Secrets: .\GITHUB_SECRETS_QUICK_SETUP.md" -ForegroundColor White
Write-Host ""
Write-Host "Railway Dashboard:" -ForegroundColor Cyan
Write-Host "  🌐 https://railway.app/project/$projectId" -ForegroundColor White
Write-Host ""

if ($allPassed) {
    exit 0
} else {
    exit 1
}
