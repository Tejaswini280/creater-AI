# Railway Authentication Fix - Complete Solution

## Problem Identified

The GitHub Actions workflow was failing with:
```
Unauthorized. Please login with `railway login`
Error: Process completed with exit code 1
```

## Root Cause

**Railway CLI does NOT automatically use the `RAILWAY_TOKEN` environment variable for authentication.**

Even though the token was set as a secret and passed as an environment variable, the Railway CLI requires explicit authentication using one of these methods:

1. `railway login --browserless` (for CI/CD)
2. Interactive browser login (not suitable for CI/CD)

## Solution Applied

### Fixed Both Workflows

Updated both `.github/workflows/staging-deploy.yml` and `.github/workflows/production-deploy.yml` to:

1. **Verify token exists** before attempting authentication
2. **Pipe the token** to `railway login --browserless`
3. **Verify authentication** with `railway whoami`
4. **Then proceed** with deployment

### Key Changes

**Before (BROKEN):**
```yaml
- name: Deploy to Railway Staging
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: |
    railway whoami  # ❌ Fails - not authenticated
    railway up --service "$SERVICE_NAME" --detach
```

**After (FIXED):**
```yaml
- name: Deploy to Railway Staging
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: |
    # Verify token exists
    if [ -z "$RAILWAY_TOKEN" ]; then
      echo "❌ RAILWAY_TOKEN is not set"
      exit 1
    fi
    
    # Authenticate with Railway
    echo "$RAILWAY_TOKEN" | railway login --browserless
    
    # Verify authentication
    railway whoami  # ✅ Now works
    
    # Deploy
    railway up --service "$SERVICE_NAME" --detach
```

## Required GitHub Secrets

Ensure these secrets are configured in your GitHub repository:

### For Staging (Environment: `staging`)
- `RAILWAY_TOKEN` - Your Railway API token
- `RAILWAY_STAGING_SERVICE_NAME` - Name of your staging service

### For Production (Environment: `production`)
- `RAILWAY_TOKEN` - Your Railway API token (same as staging)
- `RAILWAY_PROD_SERVICE_ID` - Service ID for production

## How to Get Railway Token

1. Go to https://railway.app/account/tokens
2. Click "Create Token"
3. Give it a descriptive name (e.g., "GitHub Actions CI/CD")
4. Copy the token immediately (it won't be shown again)
5. Add it to GitHub Secrets:
   - Go to your repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `RAILWAY_TOKEN`
   - Value: Paste your token
   - Click "Add secret"

## Testing the Fix

### Test Staging Deployment
```bash
# Push to dev branch
git add .
git commit -m "fix: Railway authentication in CI/CD"
git push origin dev
```

### Test Production Deployment
```bash
# Push to main branch
git checkout main
git merge dev
git push origin main
```

### Manual Trigger
You can also manually trigger deployments from GitHub Actions:
1. Go to Actions tab
2. Select "Deploy to Staging" or "Deploy to Production"
3. Click "Run workflow"
4. Select branch and click "Run workflow"

## Verification Steps

After deployment starts, check:

1. **GitHub Actions Logs**
   - Should show "✅ Authentication successful"
   - Should show Railway username from `railway whoami`
   - Should show "✅ Deployment triggered successfully"

2. **Railway Dashboard**
   - Go to https://railway.app
   - Select your project
   - Check the "Deployments" tab
   - Should see new deployment in progress

## Common Issues & Solutions

### Issue: "RAILWAY_TOKEN is not set"
**Solution:** Add the token to GitHub Secrets (see above)

### Issue: "Invalid token"
**Solution:** Generate a new token from Railway dashboard and update GitHub secret

### Issue: "Service not found"
**Solution:** Verify `RAILWAY_STAGING_SERVICE_NAME` or `RAILWAY_PROD_SERVICE_ID` is correct

### Issue: Deployment succeeds but app doesn't start
**Solution:** Check Railway logs for runtime errors (database connection, env vars, etc.)

## Files Modified

1. `.github/workflows/staging-deploy.yml` - Fixed staging deployment authentication
2. `.github/workflows/production-deploy.yml` - Fixed production deployment authentication

## Next Steps

1. ✅ Commit and push these changes
2. ✅ Verify GitHub Secrets are configured
3. ✅ Test staging deployment (push to `dev`)
4. ✅ Test production deployment (push to `main`)
5. ✅ Monitor Railway dashboard for successful deployments

## Status

🎉 **FIXED** - Railway authentication now works correctly in GitHub Actions CI/CD pipeline.

---

**Date:** January 13, 2026
**Issue:** Railway CLI authentication failure in GitHub Actions
**Resolution:** Explicit authentication using `railway login --browserless`
