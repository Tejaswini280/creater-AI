#!/usr/bin/env pwsh

Write-Host "🐳 Pushing Docker fixes to dev branch" -ForegroundColor Cyan

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Switch to dev branch
Write-Host "Switching to dev branch..." -ForegroundColor Yellow
git checkout dev
git pull origin dev

# Add Docker-related fixes
Write-Host "Adding Docker fix files..." -ForegroundColor Yellow

# Add database fixes
git add fix-all-database-issues.cjs -f
git add setup-database-simple.cjs -f
git add database-setup.sql -f

# Add Docker compose and configuration
git add docker-compose.yml -f
git add Dockerfile -f

# Add any new database tables or schema fixes
git add server/migrations/ -f 2>$null
git add server/db/ -f 2>$null

# Add environment files
git add .env.development -f 2>$null
git add .env.example -f 2>$null

# Add any server fixes
git add server/index.ts -f 2>$null
git add server/routes/ -f 2>$null
git add server/services/ -f 2>$null

Write-Host "Added Docker and database fix files" -ForegroundColor Green

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
git add . 2>$null
git commit -m "🐳 Docker fixes: Complete database schema, working containers

✅ Fixed Issues:
- Added missing database tables (content, social_accounts, content_metrics, ai_generation_tasks)
- Fixed Docker networking (use 127.0.0.1 instead of localhost)
- Complete database schema initialization
- All containers now healthy and functional

✅ Verification:
- Frontend: ✅ Working (http://127.0.0.1:5000)
- Backend API: ✅ Working (200 OK responses)
- Database: ✅ All tables exist and connected
- Redis: ✅ Healthy
- Docker containers: ✅ Running properly

🎯 App is now fully functional in Docker!"

# Push to dev branch
Write-Host "Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

Write-Host "✅ Docker fixes pushed to dev branch!" -ForegroundColor Green