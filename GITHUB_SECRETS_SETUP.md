# GitHub Secrets Setup Guide

This guide explains how to configure GitHub Secrets for automated CI/CD deployment to Railway.

## Required Secrets

You need to add these secrets to your GitHub repository:

| Secret Name | Description | Where to Get It |
|-------------|-------------|-----------------|
| `RAILWAY_TOKEN` | Railway API token for deployments | Railway Dashboard → Account Settings → Tokens |
| `RAILWAY_STAGING_SERVICE_ID` | Service ID for staging environment | Railway Project → Staging Service → Settings |
| `RAILWAY_PROD_SERVICE_ID` | Service ID for production environment | Railway Project → Production Service → Settings |

## Step-by-Step Setup

### 1. Get Railway Token

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click your profile picture (top right)
3. Select "Account Settings"
4. Go to "Tokens" tab
5. Click "Create Token"
6. Name it: `GitHub-Actions-CI-CD`
7. Copy the token (starts with `railway_`)
8. **Save it securely** - you won't see it again!

### 2. Get Service IDs

#### Staging Service ID
1. Go to your Railway project
2. Click on your **staging service** (the one connected to `dev` branch)
3. Go to "Settings" tab
4. Copy the "Service ID" (starts with `srv_`)

#### Production Service ID  
1. In the same Railway project
2. Click on your **production service** (the one connected to `main` branch)
3. Go to "Settings" tab
4. Copy the "Service ID" (starts with `srv_`)

### 3. Add Secrets to GitHub

1. Go to your GitHub repository: `https://github.com/Tejaswini280/creater-AI`
2. Click the "Settings" tab
3. In the left sidebar, click "Secrets and variables" → "Actions"
4. Click "New repository secret"

#### Add Each Secret:

**Secret 1: RAILWAY_TOKEN**
- Name: `RAILWAY_TOKEN`
- Value: `railway_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Click "Add secret"

**Secret 2: RAILWAY_STAGING_SERVICE_ID**
- Name: `RAILWAY_STAGING_SERVICE_ID`  
- Value: `srv_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Click "Add secret"

**Secret 3: RAILWAY_PROD_SERVICE_ID**
- Name: `RAILWAY_PROD_SERVICE_ID`
- Value: `srv_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Click "Add secret"

## Verification

After adding all secrets, you should see:

```
Repository secrets (3)
├── RAILWAY_TOKEN                    ••••••••••••••••••••••••••••••••
├── RAILWAY_STAGING_SERVICE_ID       ••••••••••••••••••••••••••••••••
└── RAILWAY_PROD_SERVICE_ID          ••••••••••••••••••••••••••••••••
```

## Security Best Practices

### ✅ Do's
- Use descriptive token names in Railway
- Regularly rotate tokens (every 90 days)
- Use separate tokens for different environments if possible
- Monitor token usage in Railway dashboard

### ❌ Don'ts  
- Never commit secrets to code
- Don't share tokens in chat/email
- Don't use the same token for multiple projects
- Don't store tokens in plain text files

## Testing the Setup

### Test Staging Deployment
1. Create a test branch from `dev`:
   ```bash
   git checkout dev
   git checkout -b test/ci-cd-setup
   echo "# CI/CD Test" >> test-file.md
   git add test-file.md
   git commit -m "test: verify CI/CD pipeline"
   git push origin test/ci-cd-setup
   ```

2. Create PR to `dev` branch
3. Merge the PR
4. Check GitHub Actions tab for deployment status
5. Verify staging deployment in Railway dashboard

### Test Production Deployment
1. Create PR from `dev` to `main`
2. Merge after review
3. Check GitHub Actions for production deployment
4. Verify production deployment in Railway dashboard

## Troubleshooting

### Invalid Token Error
```
Error: Invalid Railway token
```
**Solution**: 
- Verify token is correct in GitHub Secrets
- Check token hasn't expired in Railway
- Regenerate token if necessary

### Service Not Found Error
```
Error: Service not found
```
**Solution**:
- Verify service IDs are correct
- Check services exist in Railway project
- Ensure token has access to the project

### Permission Denied Error
```
Error: Permission denied
```
**Solution**:
- Check Railway token permissions
- Verify you're a member of the Railway project
- Ensure token isn't expired

## Environment Setup

After secrets are configured, set up environment variables in Railway:

### Staging Service Variables
```
NODE_ENV=staging
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=your_staging_openai_key
GEMINI_API_KEY=your_staging_gemini_key
SESSION_SECRET=staging-session-secret
JWT_SECRET=staging-jwt-secret
```

### Production Service Variables
```
NODE_ENV=production  
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=your_production_openai_key
GEMINI_API_KEY=your_production_gemini_key
SESSION_SECRET=production-session-secret
JWT_SECRET=production-jwt-secret
```

## Success Checklist

- [ ] Railway token created and added to GitHub Secrets
- [ ] Staging service ID added to GitHub Secrets
- [ ] Production service ID added to GitHub Secrets
- [ ] All 3 secrets visible in GitHub repository settings
- [ ] Environment variables configured in Railway services
- [ ] Test deployment to staging successful
- [ ] Test deployment to production successful
- [ ] GitHub Actions workflows running without errors

Your CI/CD pipeline is now fully configured! 🎉