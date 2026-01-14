#!/usr/bin/env pwsh

Write-Host "🔐 Pushing Auth Fixes to Dev Branch" -ForegroundColor Green

# Check current branch
$currentBranch = git branch --show-current
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Switch to dev branch
Write-Host "Switching to dev branch..." -ForegroundColor Yellow
git checkout dev

# Add auth fix files
Write-Host "Adding auth fix files..." -ForegroundColor Cyan
git add fix-auth-redirect-instant.html
git add test-auth-endpoints.cjs
git add fix-login-redirect-loop.cjs

# Add updated auth components
git add client/src/hooks/useAuth.ts
git add client/src/pages/login.tsx
git add client/src/App.tsx

# Add any other auth-related files
git add -f docker-complete-fix.cjs
git add -f docker-instant-fix.ps1
git add -f docker-health-check-complete.ps1

Write-Host "Committing auth fixes..." -ForegroundColor Cyan
git commit -m "🔐 Fix: Resolve login redirect loop and auth session persistence

- Fixed useAuth hook to prevent multiple simultaneous auth checks
- Improved login flow with better token handling
- Added browser storage clearing utility for auth issues
- Enhanced auth state management and redirect logic
- Added comprehensive auth endpoint testing
- Fixed Docker auth configuration issues

Fixes login redirect loop where users get stuck after successful login."

Write-Host "Pushing to dev branch..." -ForegroundColor Cyan
git push origin dev

Write-Host "✅ Auth fixes pushed to dev branch!" -ForegroundColor Green