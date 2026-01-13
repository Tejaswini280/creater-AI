# Railway Deployment - Complete Guide

## 🎯 Current Situation

You have two deployment options:
1. **GitHub Actions** (automated) - Currently failing due to expired token
2. **Local Deployment** (manual) - Works with browser authentication

## 🔴 Issue Summary

### GitHub Actions Error
```
Unauthorized. Please login with `railway login`
```
**Cause**: The `RAILWAY_TOKEN` in GitHub Secrets is expired or invalid.

### Local Deployment Error
```
PS> railway up --service c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9
Service not found
```
**Cause**: You need to link to the project first before deploying.

## ✅ Solution 1: Fix GitHub Actions (Recommended)

This will enable automatic deployments when you push to dev/main branches.

### Step 1: Generate New Railway Token

1. Go to: **https://railway.app/account/tokens**
2. Click **"Create Token"**
3. Name it: `GitHub Actions Deployment`
4. **IMPORTANT**: Copy the token immediately (you only see it once!)
   - It looks like: `989362ba-ed21-4697-b3a4-fccd5beee0e5`

### Step 2: Update GitHub Secrets

1. Go to: **https://github.com/Tejaswini280/creater-AI/settings/secrets/actions**

2. Update or create these secrets:

| Secret Name | Value | How to Get |
|------------|-------|------------|
| `RAILWAY_TOKEN` | `[your-new-token]` | From Step 1 above |
| `RAILWAY_PROJECT_ID` | `711091cc-10bf-41a3-87cf-8d058419de4f` | Already have this |
| `RAILWAY_STAGING_SERVICE_ID` | `c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9` | Already have this |
| `RAILWAY_PROD_SERVICE_ID` | `db7499d8-fa40-476e-a943-9d62370bf3a8` | Already have this |

3. For each secret:
   - Click **"New repository secret"** (or **"Update"** if it exists)
   - Enter the **Name** and **Secret** value
   - Click **"Add secret"** or **"Update secret"**

### Step 3: Test the Deployment

```bash
# Trigger the workflow
git commit --allow-empty -m "Test Railway deployment with new token"
git push origin dev
```

Then check: **https://github.com/Tejaswini280/creater-AI/actions**

## ✅ Solution 2: Deploy Locally (Quick Fix)

Use this while you're setting up GitHub Actions, or for manual deployments.

### Option A: Use the PowerShell Script (Easiest)

```powershell
# Run the deployment script
.\deploy-staging-local.ps1
```

This script will:
- ✅ Check Railway CLI is installed
- ✅ Verify you're authenticated
- ✅ Link to the project automatically
- ✅ Deploy to staging service
- ✅ Show you the deployment URL

### Option B: Manual Commands

```powershell
# 1. Make sure you're logged in
railway login

# 2. Link to your project (IMPORTANT!)
railway link --project 711091cc-10bf-41a3-87cf-8d058419de4f

# 3. Deploy to staging service
railway up --service c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9
```

### Option C: Deploy to Production

```powershell
# Link to project
railway link --project 711091cc-10bf-41a3-87cf-8d058419de4f

# Deploy to production service
railway up --service db7499d8-fa40-476e-a943-9d62370bf3a8
```

## 📊 Your Railway Services

Based on your configuration:

```
Project: CreatorNexus
├── 📦 Staging Service
│   └── ID: c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9
│   └── Branch: dev
│
└── 📦 Production Service
    └── ID: db7499d8-fa40-476e-a943-9d62370bf3a8
    └── Branch: main
```

## 🔍 Troubleshooting

### "Unauthorized" Error in GitHub Actions

**Problem**: Token is expired or invalid

**Solution**:
1. Generate new token at: https://railway.app/account/tokens
2. Update `RAILWAY_TOKEN` in GitHub Secrets
3. Push to dev branch to trigger deployment

### "Service not found" Error Locally

**Problem**: Not linked to project

**Solution**:
```powershell
# Link to project first
railway link --project 711091cc-10bf-41a3-87cf-8d058419de4f

# Then deploy
railway up --service c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9
```

### Railway CLI Not Found

**Problem**: Railway CLI not installed

**Solution**:
```powershell
npm install -g @railway/cli@latest
railway --version
```

### Wrong Service ID

**Problem**: Using incorrect service ID

**Solution**: Use the correct IDs:
- Staging: `c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9`
- Production: `db7499d8-fa40-476e-a943-9d62370bf3a8`

## 📝 Files Updated

1. ✅ `.github/workflows/staging-deploy.yml` - Fixed workflow with proper error handling
2. ✅ `deploy-staging-local.ps1` - New local deployment script
3. ✅ `RAILWAY_DEPLOYMENT_COMPLETE_GUIDE.md` - This guide

## 🎯 Next Steps

### Immediate (Do This Now):

1. **Update Railway Token in GitHub Secrets**
   - Go to: https://railway.app/account/tokens
   - Create new token
   - Update at: https://github.com/Tejaswini280/creater-AI/settings/secrets/actions

2. **Test Local Deployment**
   ```powershell
   .\deploy-staging-local.ps1
   ```

### After Token Update:

3. **Push to Dev Branch**
   ```bash
   git add .
   git commit -m "Fix Railway deployment authentication"
   git push origin dev
   ```

4. **Monitor Deployment**
   - GitHub Actions: https://github.com/Tejaswini280/creater-AI/actions
   - Railway Dashboard: https://railway.app/project/711091cc-10bf-41a3-87cf-8d058419de4f

## 🎉 Success Indicators

You'll know it's working when:

✅ GitHub Actions shows green checkmark
✅ Railway dashboard shows "Deployed"
✅ Your app is accessible at the Railway URL
✅ No "Unauthorized" errors in logs

## 💡 Pro Tips

1. **Keep tokens secure**: Never commit them to git
2. **Use different tokens**: One for local dev, one for CI/CD
3. **Rotate regularly**: Create new tokens every few months
4. **Monitor deployments**: Check Railway dashboard after each push
5. **Use the script**: `deploy-staging-local.ps1` makes local deployment easy

## 🆘 Still Having Issues?

If you're still stuck:

1. **Check Railway Status**: https://status.railway.app/
2. **View Railway Logs**: 
   ```powershell
   railway logs --service c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9
   ```
3. **Check GitHub Actions Logs**: Look for specific error messages
4. **Verify Secrets**: Make sure all secrets are set correctly in GitHub

## Summary

**The main issue is authentication.** Update the Railway token in GitHub Secrets and you're good to go!

**Quick Fix**: Use `.\deploy-staging-local.ps1` to deploy right now while you set up GitHub Actions.
