#!/usr/bin/env pwsh

Write-Host "Fixing Railway start script issue..." -ForegroundColor Green

# Add and commit the changes
Write-Host "Adding railway:start script to package.json..." -ForegroundColor Yellow
git add package.json nixpacks.toml

Write-Host "Committing railway start script fix..." -ForegroundColor Yellow
git commit -m "fix: Add railway:start script to resolve deployment error"

Write-Host "Pushing railway start script fix to dev branch..." -ForegroundColor Yellow
git push origin dev

Write-Host "Railway start script fix pushed successfully!" -ForegroundColor Green
Write-Host "Railway should now be able to deploy without the missing script error." -ForegroundColor Cyan