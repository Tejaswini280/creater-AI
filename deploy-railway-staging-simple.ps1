# Simple Railway Staging Deployment
# Fixes migration dependency issues

Write-Host "🚀 Railway Staging Deployment" -ForegroundColor Green

# Update package.json scripts
Write-Host "📝 Updating package.json..." -ForegroundColor Yellow
$packageContent = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageContent.scripts | Add-Member -Name "railway:start" -Value "npm run migrate:enhanced; npm start" -Force
$packageContent.scripts | Add-Member -Name "railway:migrate" -Value "npm run migrate:enhanced" -Force
$packageContent.scripts | Add-Member -Name "railway:verify" -Value "node verify-railway-deployment.cjs" -Force
$packageContent | ConvertTo-Json -Depth 10 | Set-Content "package.json"

# Create Railway config
Write-Host "🔧 Creating Railway config..." -ForegroundColor Yellow
$railwayConfig = @'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "npm run railway:start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
'@
Set-Content -Path "railway.json" -Value $railwayConfig

# Commit changes
Write-Host "📤 Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "fix: Railway staging deployment with enhanced migrations"

# Push to staging
Write-Host "🚀 Pushing to staging..." -ForegroundColor Yellow
git push origin staging --force

Write-Host "✅ Railway staging deployment complete!" -ForegroundColor Green
Write-Host "🔍 Monitor at: https://railway.app" -ForegroundColor Cyan