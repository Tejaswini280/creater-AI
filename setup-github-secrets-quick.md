# Quick GitHub Secrets Setup

## Immediate Fix for Railway Deployment Error

The error `unexpected argument '***' found` occurs because GitHub Secrets are not configured.

### 1. Add These Secrets to GitHub

Go to: `https://github.com/Tejaswini280/creater-AI/settings/secrets/actions`

Click "New repository secret" for each:

| Secret Name | Value |
|-------------|-------|
| `RAILWAY_TOKEN` | `7bea4487-4542-4542-a02e-a40888c4b2b8` |
| `RAILWAY_PROJECT_ID` | `711091cc-10bf-41a3-87cf-8d058419de4f` |
| `RAILWAY_STAGING_SERVICE_ID` | `01abc727-2496-4948-95e7-c05f629936e8` |

### 2. Verify Secrets Are Added

After adding, you should see:
```
Repository secrets (3)
├── RAILWAY_TOKEN                    ••••••••••••••••••••••••••••••••
├── RAILWAY_PROJECT_ID               ••••••••••••••••••••••••••••••••
└── RAILWAY_STAGING_SERVICE_ID       ••••••••••••••••••••••••••••••••
```

### 3. Test the Fix

Push any change to the `dev` branch to trigger the workflow:

```bash
git checkout dev
echo "# Test deployment fix" >> test-deployment.md
git add test-deployment.md
git commit -m "fix: test deployment after adding GitHub secrets"
git push origin dev
```

### 4. Alternative: Manual Railway Deployment

If you need to deploy immediately while setting up secrets:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link 711091cc-10bf-41a3-87cf-8d058419de4f
railway up --detach
```

## Root Cause Explained

The workflow file uses `${{ secrets.RAILWAY_PROJECT_ID }}` which GitHub replaces with `***` when the secret doesn't exist, causing:

```bash
railway link ***  # ❌ Invalid
railway link 711091cc-10bf-41a3-87cf-8d058419de4f  # ✅ Correct
```

Once you add the secrets, the workflow will work correctly.