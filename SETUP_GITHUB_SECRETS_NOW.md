# Setup GitHub Secrets - Quick Guide

## You Need to Add These Secrets to GitHub

Go to: https://github.com/Tejaswini280/creater-AI/settings/secrets/actions

Click **"New repository secret"** for each of these:

### 1. RAILWAY_TOKEN
- **Name**: `RAILWAY_TOKEN`
- **Value**: Get from https://railway.app/account/tokens
- **How to get**:
  1. Go to Railway → Account → Tokens
  2. Click "Create Token"
  3. Name it: "GitHub Actions"
  4. Copy the token (you'll only see it once!)
  5. Paste it in GitHub Secret

### 2. RAILWAY_PROJECT_ID
- **Name**: `RAILWAY_PROJECT_ID`
- **Value**: `711091cc-10bf-41a3-87cf-8d058419de4f`

### 3. RAILWAY_STAGING_SERVICE_ID
- **Name**: `RAILWAY_STAGING_SERVICE_ID`
- **Value**: `c8a923f8-2eaf-4cc4-b2a7-fb487c46b1a9`

### 4. RAILWAY_PROD_SERVICE_ID (Optional, for production)
- **Name**: `RAILWAY_PROD_SERVICE_ID`
- **Value**: `db7499d8-fa40-476e-a943-9d62370bf3a8`

## After Adding Secrets

1. Commit and push the updated workflow:
   ```bash
   git add .github/workflows/staging-deploy.yml
   git commit -m "Update Railway workflow to use GitHub Secrets"
   git push origin dev
   ```

2. The workflow will automatically run and deploy to staging!

3. Check the deployment:
   - GitHub Actions: https://github.com/Tejaswini280/creater-AI/actions
   - Railway Dashboard: https://railway.app/project/711091cc-10bf-41a3-87cf-8d058419de4f

## Visual Guide

```
GitHub Repository
└── Settings
    └── Secrets and variables
        └── Actions
            └── New repository secret
                ├── Name: RAILWAY_TOKEN
                └── Secret: [paste your token]
```

## Important Notes

- **Never commit tokens to git!** Always use GitHub Secrets
- Tokens are sensitive - treat them like passwords
- If a token is exposed, revoke it immediately and create a new one
- The workflow file now uses `${{ secrets.RAILWAY_TOKEN }}` which is secure

## Test the Setup

After adding all secrets, test with:

```bash
# Make a small change
git commit --allow-empty -m "Test Railway deployment with secrets"
git push origin dev
```

Then watch the deployment at:
https://github.com/Tejaswini280/creater-AI/actions
