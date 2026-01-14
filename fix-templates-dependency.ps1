# Fix Templates Table Migration Dependency

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "FIXING TEMPLATES TABLE MIGRATION DEPENDENCY" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Write-Host "Loading environment variables from .env..." -ForegroundColor Green
    Get-Content .env | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}
else {
    Write-Host "No .env file found, using existing environment variables" -ForegroundColor Yellow
}

# Check if DATABASE_URL is set
$dbUrl = [Environment]::GetEnvironmentVariable("DATABASE_URL", "Process")
if (-not $dbUrl) {
    Write-Host "ERROR: DATABASE_URL not set" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL in your .env file" -ForegroundColor Red
    exit 1
}

Write-Host "Database URL configured" -ForegroundColor Green
Write-Host ""

# Run the fix script
Write-Host "Executing fix script..." -ForegroundColor Cyan
node fix-templates-migration-dependency.cjs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "TEMPLATES TABLE DEPENDENCY FIX COMPLETED" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your application" -ForegroundColor White
    Write-Host "2. Migration 0004 will now execute successfully" -ForegroundColor White
    Write-Host "3. All essential tables are created" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "Fix script failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host "Check the error messages above" -ForegroundColor Red
    Write-Host ""
    exit 1
}
