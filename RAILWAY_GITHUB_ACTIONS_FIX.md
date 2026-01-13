# Railway GitHub Actions Authentication Fix

## Problem

GitHub Actions deployment is failing with:
```
Unauthorized. Please login with `railway login`
```

Even though `RAILWAY_TOKEN` is set in GitHub Secrets.

## Root Cause

The Railway token in GitHub Secrets is either:
1. Expired or revoked
2. Missing required permissions
3. Not properly formatted

## Solution Steps

### Step 1: Generate a New Railway Token

1. Go to Railway Dashboard: https://railway.app/account/tokens
2. Click "Create Token"
3. Give it a name: `GitHub Actions Deployment`
4. **Important**: Make sure to copy the token immediately (you'll only see it once!)

### Step 2: Update GitHub Secret

1. Go to your GitHub repository: https://github.com/Tejaswini280/creater-AI
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Find `RAILWAY_TOKEN` in the list
4. Click **Update** (or **New repository secret** if it doesn't exist)
5. Paste the new token value
6. Click **Update secret**

### Step 3: Verify the Token Format

The token should look like this:
```
989362ba-ed21-4697-b3a4-fccd5beee0e5
```

**Important**: Make sure there are:
- No extra spaces
- No quotes
- No line breaks
- Just the raw token value

### Step 4: Test the Deployment

After updating the secret:

1. Make a small change to trigger the workflow:
   ```bash
   git commit --allow-empty -m "Test Railway deployment"
   git push origin dev
   ```

2. Check the workflow: https://github.com/Tejaswini280/creater-AI/actions

3. The deployment should now work!

## Alternative: Use Railway CLI Locally

If GitHub Actions continues to fail, you can deploy locally:

### Option 1: Using Your Browser Login

```powershell
# You're already logged in via browser
railway link --project 711091cc-10bf-41a3-87cf-8d058419de4f
railway up
```

### Option 2: Using Token Directly

```powershell
# Set the token in your terminal
$env:RAILWAY_TOKEN = "your-token-here"

# Deploy
railway link --project 711091cc-10bf-41a3-87cf-8d058419de4f
railway up
```

## Correct Service IDs

Based on your GitHub Secrets screenshot:

- **Project ID**: `711091cc-10bf-41a3-87cf-8d058419de4f`
- **Staging Service ID**: `c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9`
- **Production Service ID**: `db7499d8-fa40-476e-a943-9d62370bf3a8`

## Updated Workflow File

The workflow should use the correct staging service ID from your secrets.

## Troubleshooting

### If the token still doesn't work:

1. **Check token permissions**:
   - Go to Railway → Account → Tokens
   - Make sure the token has access to your project

2. **Regenerate the token**:
   - Delete the old token in Railway
   - Create a new one
   - Update GitHub Secret immediately

3. **Check Railway CLI version**:
   ```bash
   railway --version
   ```
   Update if needed:
   ```bash
   npm install -g @railway/cli@latest
   ```

4. **Test token locally first**:
   ```powershell
   $env:RAILWAY_TOKEN = "your-token"
   railway whoami
   ```
   If this works, the token is valid.

## Summary

✅ Get new Railway token from: https://railway.app/account/tokens
✅ Update GitHub Secret: Settings → Secrets → RAILWAY_TOKEN
✅ Use correct service ID: `c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9`
✅ Test with empty commit to dev branch
