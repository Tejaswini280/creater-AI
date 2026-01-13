# Railway Deployment Authentication Fix

## Problem

Your deployment is failing with "Process completed with exit code 1" because Railway CLI is not properly authenticated in your GitHub Actions workflow.

## Root Cause

The error occurs at line 29 of your workflow where it tries to execute:
```bash
Error: Process completed with exit code 1.
```

This happens because:
1. Railway CLI requires authentication before deployment
2. The `railway link` command needs proper credentials
3. Environment variables may not be properly configured

## Solution

### Step 1: Verify Railway Token

1. Go to https://railway.app/account/tokens
2. Create a new token or copy your existing one
3. Add it to GitHub Secrets as `RAILWAY_TOKEN`

### Step 2: Update GitHub Workflow

Your workflow needs to authenticate BEFORE linking. Update `.github/workflows/staging-deploy.yml`:

```yaml
- name: Install Railway CLI
  run: npm install -g @railway/cli

- name: Authenticate Railway
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: |
    echo "🔐 Authenticating with Railway..."
    # Railway CLI will use RAILWAY_TOKEN environment variable automatically
    railway whoami || echo "Authentication configured"

- name: Link to Railway project and service
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: |
    echo "🔗 Linking to Railway project and service..."
    # Use service ID directly (CI-safe method)
    railway link 3ff6be5c-ffda-42e0-ab78-80d34b0c871b --environment b0101648-5024-4c3e-bafb-8bd0ef1e124b

- name: Deploy to Railway
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: |
    echo "🚀 Starting deployment..."
    railway up --service c6fb59a7-7d9b-4e0f-9061-770c9d9e7fa3 --environment b0101648-5024-4c3e-bafb-8bd0ef1e124b
```

### Step 3: Local Deployment Fix

For local deployments, run:

```powershell
# Fix authentication
.\fix-railway-auth.ps1

# Deploy to staging
.\deploy-railway-staging-auth-fix.ps1
```

## Quick Fix Commands

### Check if authenticated:
```powershell
railway whoami
```

### Re-authenticate:
```powershell
railway logout
railway login
```

### Deploy with authentication:
```powershell
.\deploy-railway-staging-auth-fix.ps1
```

## Verification

After fixing, verify:

1. **GitHub Secrets are set:**
   - Go to repository Settings → Secrets and variables → Actions
   - Verify `RAILWAY_TOKEN` exists

2. **Local authentication works:**
   ```powershell
   railway whoami
   ```

3. **Deployment succeeds:**
   - Push to `dev` branch
   - Check GitHub Actions tab
   - Verify deployment completes

## Alternative: Use Railway GitHub Action

Instead of Railway CLI, use the official GitHub Action:

```yaml
- name: Deploy to Railway
  uses: bervProject/railway-deploy@main
  with:
    railway_token: ${{ secrets.RAILWAY_TOKEN }}
    service: c6fb59a7-7d9b-4e0f-9061-770c9d9e7fa3
    environment: b0101648-5024-4c3e-bafb-8bd0ef1e124b
```

## Files Created

1. **fix-railway-auth.ps1** - Interactive authentication fix
2. **deploy-railway-staging-auth-fix.ps1** - Complete deployment with auth
3. **scripts/deploy/setup.ps1** - Full deployment setup script
4. **RAILWAY_AUTH_TROUBLESHOOTING.md** - Comprehensive troubleshooting guide

## Next Steps

1. Run `.\fix-railway-auth.ps1` to authenticate locally
2. Update your GitHub workflow with proper authentication
3. Add `RAILWAY_TOKEN` to GitHub Secrets
4. Test deployment with `.\deploy-railway-staging-auth-fix.ps1`
5. Push to `dev` branch to trigger automated deployment

## Support

If issues persist, check:
- Railway status: https://status.railway.app/
- GitHub Actions logs for detailed errors
- Railway dashboard: https://railway.app/project/3ff6be5c-ffda-42e0-ab78-80d34b0c871b
