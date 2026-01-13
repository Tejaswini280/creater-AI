# Verify GitHub Secrets Configuration

## Required Secrets Checklist

Before the next deployment, verify these secrets are configured in your GitHub repository:

### How to Check
1. Go to: https://github.com/Tejaswini280/creater-AI/settings/secrets/actions
2. Verify the following secrets exist:

### Repository Secrets (Available to all environments)
- ✅ `RAILWAY_TOKEN` - Your Railway API token

### Environment: `staging`
- ✅ `RAILWAY_STAGING_SERVICE_NAME` - Name of your staging service in Railway

### Environment: `production`
- ✅ `RAILWAY_PROD_SERVICE_ID` - Service ID for production in Railway

## How to Get These Values

### 1. RAILWAY_TOKEN
```bash
# Go to Railway dashboard
https://railway.app/account/tokens

# Click "Create Token"
# Copy the token (shown only once!)
# Add to GitHub Secrets as RAILWAY_TOKEN
```

### 2. RAILWAY_STAGING_SERVICE_NAME
```bash
# Go to your Railway project
https://railway.app

# Click on your staging service
# The service name is shown at the top
# Example: "creator-ai-staging" or "web"
# Add to GitHub Environment Secret (staging) as RAILWAY_STAGING_SERVICE_NAME
```

### 3. RAILWAY_PROD_SERVICE_ID
```bash
# Go to your Railway project
https://railway.app

# Click on your production service
# Look at the URL: https://railway.app/project/{PROJECT_ID}/service/{SERVICE_ID}
# Copy the SERVICE_ID from the URL
# Add to GitHub Environment Secret (production) as RAILWAY_PROD_SERVICE_ID
```

## Quick Setup Commands

### Option 1: Using Railway CLI (Recommended)
```bash
# Login to Railway
railway login

# Get service info
railway status

# This will show:
# - Service Name (use for RAILWAY_STAGING_SERVICE_NAME)
# - Service ID (use for RAILWAY_PROD_SERVICE_ID)
```

### Option 2: Using Railway Dashboard
1. Go to https://railway.app
2. Select your project
3. Click on each service
4. Copy the service name/ID from the URL or service details

## Testing After Setup

### Test Staging Deployment
```bash
# This will trigger the staging workflow
git push origin dev
```

### Test Production Deployment
```bash
# This will trigger the production workflow
git push origin main
```

### Manual Test
1. Go to: https://github.com/Tejaswini280/creater-AI/actions
2. Select "Deploy to Staging" or "Deploy to Production"
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow" button

## Expected Success Output

When secrets are configured correctly, you should see:

```
🚀 Deploying to Railway Staging...
🔐 Authenticating with Railway...
✅ Authentication successful
Logged in as: your-railway-username
📦 Deploying service...
✅ Deployment triggered successfully
```

## Troubleshooting

### Error: "RAILWAY_TOKEN is not set"
**Fix:** Add RAILWAY_TOKEN to repository secrets

### Error: "Invalid token"
**Fix:** Generate new token from Railway and update GitHub secret

### Error: "Service not found"
**Fix:** Verify service name/ID is correct in environment secrets

### Error: "Unauthorized"
**Fix:** Ensure token has correct permissions (should have full access)

## Current Status

✅ Workflows fixed and pushed to `dev` branch
⏳ Waiting for GitHub Secrets verification
⏳ Ready to test deployment once secrets are configured

---

**Next Action:** Verify all secrets are configured, then push to trigger deployment test.
