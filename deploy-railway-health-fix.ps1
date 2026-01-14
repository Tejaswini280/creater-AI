Write-Host "🚀 Deploying to Railway with health check fix..." -ForegroundColor Green

# Add all changes
git add .

# Commit with descriptive message
git commit -m "fix: add health check endpoint and disable Railway health check timeout"

# Push to current branch
git push

Write-Host "✅ Deployment pushed! Railway should now deploy successfully." -ForegroundColor Green
Write-Host "🔍 Monitor deployment at: https://railway.app" -ForegroundColor Yellow