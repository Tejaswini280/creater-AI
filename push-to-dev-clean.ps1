Write-Host "Pushing 502 error fixes to dev branch..." -ForegroundColor Green

# Add all files
git add .

# Create commit
git commit -m "fix: Complete 502 error resolution with database schema fixes"

# Push to dev branch
git push origin dev

Write-Host "Successfully pushed 502 error fixes to dev branch!" -ForegroundColor Green