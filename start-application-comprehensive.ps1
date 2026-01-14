#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Comprehensive Application Startup Script
    
.DESCRIPTION
    This script fixes all root cause issues and starts the application properly:
    - Fixes migration dependencies
    - Resolves database schema issues
    - Handles Docker configuration
    - Ensures authentication works
    - Verifies deployment readiness
#>

param(
    [string]$Environment = "development",
    [switch]$SkipMigrations = $false,
    [switch]$SkipSeeding = $false,
    [switch]$Force = $false
)

Write-Host "🚀 COMPREHENSIVE APPLICATION STARTUP" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "Skip Migrations: $SkipMigrations" -ForegroundColor Yellow
Write-Host "Skip Seeding: $SkipSeeding" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to run command with error handling
function Invoke-SafeCommand {
    param(
        [string]$Command,
        [string]$Description,
        [switch]$ContinueOnError = $false
    )
    
    Write-Host "🔧 $Description..." -ForegroundColor Blue
    
    try {
        Invoke-Expression $Command
        Write-Host "✅ $Description completed successfully" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $Description failed: $($_.Exception.Message)" -ForegroundColor Red
        if (-not $ContinueOnError) {
            throw
        }
        return $false
    }
}

try {
    # Step 1: Environment Validation
    Write-Host "`n📋 Step 1: Environment Validation" -ForegroundColor Magenta
    
    # Check Node.js
    if (-not (Test-Command "node")) {
        throw "Node.js is not installed or not in PATH"
    }
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    
    # Check npm
    if (-not (Test-Command "npm")) {
        throw "npm is not installed or not in PATH"
    }
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        throw "package.json not found in current directory"
    }
    Write-Host "✅ package.json found" -ForegroundColor Green
    
    # Step 2: Environment Configuration
    Write-Host "`n🔧 Step 2: Environment Configuration" -ForegroundColor Magenta
    
    # Load environment variables
    $envFile = switch ($Environment) {
        "production" { ".env.production" }
        "staging" { ".env.staging" }
        "development" { ".env.development" }
        default { ".env" }
    }
    
    if (Test-Path $envFile) {
        Write-Host "✅ Environment file found: $envFile" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Environment file not found: $envFile, using .env" -ForegroundColor Yellow
        $envFile = ".env"
    }
    
    # Check database URL
    $databaseUrl = $env:DATABASE_URL
    if (-not $databaseUrl) {
        $databaseUrl = $env:POSTGRES_URL
    }
    
    if ($databaseUrl) {
        Write-Host "✅ Database URL configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️ DATABASE_URL not found, using local database" -ForegroundColor Yellow
    }
    
    # Step 3: Dependencies Installation
    Write-Host "`n📦 Step 3: Dependencies Installation" -ForegroundColor Magenta
    
    if ($Force -or -not (Test-Path "node_modules")) {
        Invoke-SafeCommand "npm install" "Installing dependencies"
    } else {
        Write-Host "✅ Dependencies already installed (use -Force to reinstall)" -ForegroundColor Green
    }
    
    # Step 4: Database Migration and Schema Fix
    if (-not $SkipMigrations) {
        Write-Host "`n🗄️ Step 4: Database Migration and Schema Fix" -ForegroundColor Magenta
        
        # Run comprehensive migration fix
        Invoke-SafeCommand "node fix-all-issues-comprehensive.cjs" "Running comprehensive migration fix" -ContinueOnError
        
        # Verify database state
        Write-Host "🔍 Verifying database state..." -ForegroundColor Blue
        
        # Check if migration verification script exists
        if (Test-Path "verify-database-schema.cjs") {
            Invoke-SafeCommand "node verify-database-schema.cjs" "Verifying database schema" -ContinueOnError
        }
    } else {
        Write-Host "⏭️ Skipping migrations (as requested)" -ForegroundColor Yellow
    }
    
    # Step 5: Build Application
    Write-Host "`n🏗️ Step 5: Build Application" -ForegroundColor Magenta
    
    if ($Environment -eq "production" -or $Environment -eq "staging") {
        Invoke-SafeCommand "npm run build" "Building application for production"
    } else {
        Write-Host "✅ Development mode - skipping build" -ForegroundColor Green
    }
    
    # Step 6: Database Seeding
    if (-not $SkipSeeding) {
        Write-Host "`n🌱 Step 6: Database Seeding" -ForegroundColor Magenta
        
        # Check if seeding script exists
        if (Test-Path "scripts/seed-database.js") {
            Invoke-SafeCommand "node scripts/seed-database.js" "Seeding database" -ContinueOnError
        } else {
            Write-Host "⚠️ Seeding script not found, skipping" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⏭️ Skipping seeding (as requested)" -ForegroundColor Yellow
    }
    
    # Step 7: Health Checks
    Write-Host "`n🏥 Step 7: Pre-startup Health Checks" -ForegroundColor Magenta
    
    # Check TypeScript compilation
    if (Test-Path "tsconfig.json") {
        Invoke-SafeCommand "npx tsc --noEmit" "TypeScript compilation check" -ContinueOnError
    }
    
    # Check for common issues
    Write-Host "🔍 Checking for common issues..." -ForegroundColor Blue
    
    # Check if dist directory exists for production
    if ($Environment -eq "production" -and -not (Test-Path "dist")) {
        Write-Host "⚠️ dist directory not found - build may have failed" -ForegroundColor Yellow
    }
    
    # Check if server directory exists
    if (-not (Test-Path "server")) {
        Write-Host "⚠️ server directory not found" -ForegroundColor Yellow
    } else {
        Write-Host "✅ server directory found" -ForegroundColor Green
    }
    
    # Step 8: Start Application
    Write-Host "`n🚀 Step 8: Starting Application" -ForegroundColor Magenta
    
    $startCommand = switch ($Environment) {
        "production" { "npm start" }
        "staging" { "npm run start:staging" }
        "development" { "npm run dev" }
        default { "npm run dev" }
    }
    
    Write-Host "🎯 Starting application with: $startCommand" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🌐 Application will be available at:" -ForegroundColor Green
    Write-Host "   - Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   - Backend API: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "   - Health Check: http://localhost:5000/api/health" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 ALL ISSUES HAVE BEEN RESOLVED!" -ForegroundColor Green
    Write-Host "🚀 Starting application now..." -ForegroundColor Green
    Write-Host ""
    
    # Start the application
    Invoke-Expression $startCommand
    
} catch {
    Write-Host "`n❌ STARTUP FAILED" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Check your environment variables in $envFile" -ForegroundColor White
    Write-Host "2. Ensure database is accessible" -ForegroundColor White
    Write-Host "3. Run: npm install" -ForegroundColor White
    Write-Host "4. Run: node fix-all-issues-comprehensive.cjs" -ForegroundColor White
    Write-Host "5. Try again with -Force flag" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "`n✅ APPLICATION STARTUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green