# Push Creator AI Studio to new repository
Write-Host "🚀 Pushing Creator AI Studio to tejaswini280/creator-AI..." -ForegroundColor Green

# Remove existing remote if exists
git remote remove new-repo 2>$null

# Add new repository as remote
git remote add new-repo https://github.com/tejaswini280/creator-AI.git

# Push current branch to main branch of new repo
git push new-repo tk-final-Creator-AI:main

Write-Host "✅ Successfully pushed to https://github.com/tejaswini280/creator-AI" -ForegroundColor Green
Write-Host "🎉 Your Creator AI Studio is now available in your repository!" -ForegroundColor Yellow