# Deploy Vite import fix to dev branch
Write-Host "🚀 Deploying Vite import fix to dev..." -ForegroundColor Green

# Add all changes
git add .

# Commit the fix
git commit -m "fix: resolve Vite import error in production build

- Add production environment check in setupVite function
- Exclude vite.ts file from production Docker container
- Ensure static file serving is used in production instead of Vite
- Fix ERR_MODULE_NOT_FOUND error for 'vite' package in production"

# Push to dev branch
Write-Host "📤 Pushing to dev branch..." -ForegroundColor Yellow
git push origin dev

Write-Host "✅ Deployment to dev complete! The Vite import error should be resolved." -ForegroundColor Green
Write-Host "🔍 Monitor the Railway dev deployment logs to confirm the fix works." -ForegroundColor Cyan