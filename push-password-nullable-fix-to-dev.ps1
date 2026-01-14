# Push Password Nullable Fix to Dev Branch

Write-Host "Pushing Password Nullable Fix to Dev Branch..." -ForegroundColor Cyan

# Ensure we're on dev branch
git checkout dev

# Add the new migration
git add migrations/0022_fix_password_nullable_for_oauth.sql

# Commit the fix
git commit -m "fix: make password column nullable for OAuth users - CRITICAL FIX

ROOT CAUSE:
- Previous migrations added NOT NULL constraint to password column
- OAuth users authenticate without passwords
- Migration 0010 tries to INSERT OAuth users without passwords
- This causes constraint violation and blocks all migrations

SOLUTION:
- Remove NOT NULL constraint from password and password_hash columns
- Allow NULL values for OAuth users
- Clean up invalid password values
- Add verification to ensure fix works

This fixes the error:
null value in column password of relation users violates not-null constraint"

# Push to dev branch
git push origin dev

Write-Host ""
Write-Host "Password nullable fix pushed to dev branch!" -ForegroundColor Green
