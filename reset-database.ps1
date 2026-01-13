# Database Reset Script - Complete Clean, Migrate, and Seed
# This script will drop all tables, recreate schema, run migrations, and seed data

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Reset Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.*?)\s*$') {
            [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
    Write-Host "✓ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 1: Cleaning database..." -ForegroundColor Yellow
node reset-database.cjs clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Database cleaning failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Running migrations..." -ForegroundColor Yellow
node reset-database.cjs migrate

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Migration failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Seeding database..." -ForegroundColor Yellow
node reset-database.cjs seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Seeding failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Database Reset Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your database has been:" -ForegroundColor Cyan
Write-Host "  ✓ Cleaned (all tables dropped)" -ForegroundColor Green
Write-Host "  ✓ Migrated (schema recreated)" -ForegroundColor Green
Write-Host "  ✓ Seeded (test data added)" -ForegroundColor Green
Write-Host ""
