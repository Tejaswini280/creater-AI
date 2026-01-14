# Quick deploy script for password hash NULL constraint fix
Write-Host "Pushing password hash fix to Railway..." -ForegroundColor Cyan
git push origin main
Write-Host "Done! Railway will redeploy automatically." -ForegroundColor Green
