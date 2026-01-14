# Railway Authentication Fix Script
# Fixes common Railway CLI authentication issues on Windows

Write-Host "Railway Authentication Fix" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
Write-Host "Checking Railway CLI installation..." -ForegroundColor Yellow
$railwayExists = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayExists) {
    Write-Host "Railway CLI not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Railway CLI" -ForegroundColor Red
        Write-Host "Please install manually: npm install -g @railway/cli" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "Railway CLI installed" -ForegroundColor Green
} else {
    Write-Host "Railway CLI found" -ForegroundColor Green
}

Write-Host ""

# Check current authentication status
Write-Host "Checking authentication status..." -ForegroundColor Yellow
$whoami = railway whoami 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Already authenticated" -ForegroundColor Green
    Write-Host "User: $whoami" -ForegroundColor Cyan
    Write-Host ""
    
    $response = Read-Host "Do you want to re-authenticate? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Keeping current authentication" -ForegroundColor Green
        exit 0
    }
} else {
    Write-Host "Not authenticated" -ForegroundColor Yellow
}

Write-Host ""

# Logout first to clear any corrupted state
Write-Host "Clearing authentication state..." -ForegroundColor Yellow
railway logout 2>&1 | Out-Null

Write-Host ""

# Authenticate
Write-Host "Starting authentication..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Choose authentication method:" -ForegroundColor Cyan
Write-Host "1. Browser login (recommended)" -ForegroundColor White
Write-Host "2. Token authentication" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter choice 1 or 2"

if ($choice -eq "2") {
    Write-Host ""
    Write-Host "Get your token from: https://railway.app/account/tokens" -ForegroundColor Cyan
    Write-Host ""
    $token = Read-Host "Enter your Railway token" -AsSecureString
    $tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
    )
    
    $env:RAILWAY_TOKEN = $tokenPlain
    
    # Test authentication
    $whoami = railway whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Authentication successful!" -ForegroundColor Green
        Write-Host "User: $whoami" -ForegroundColor Cyan
        
        # Save token to environment
        Write-Host ""
        $saveToken = Read-Host "Save token to .env file? (y/N)"
        if ($saveToken -eq 'y' -or $saveToken -eq 'Y') {
            $envPath = ".env"
            if (Test-Path $envPath) {
                $content = Get-Content $envPath
                $content = $content | Where-Object { $_ -notmatch '^RAILWAY_TOKEN=' }
                $content += "RAILWAY_TOKEN=$tokenPlain"
                $content | Set-Content $envPath
                Write-Host "Token saved to .env" -ForegroundColor Green
            }
        }
    } else {
        Write-Host ""
        Write-Host "Authentication failed" -ForegroundColor Red
        Write-Host "Please check your token and try again" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "Opening browser for authentication..." -ForegroundColor Yellow
    Write-Host "Please complete the login in your browser" -ForegroundColor Cyan
    Write-Host ""
    
    railway login
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Authentication successful!" -ForegroundColor Green
        
        $whoami = railway whoami 2>&1
        Write-Host "User: $whoami" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "Authentication failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Railway authentication setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Link to project: railway link" -ForegroundColor White
Write-Host "2. Deploy: railway up" -ForegroundColor White
Write-Host ""
