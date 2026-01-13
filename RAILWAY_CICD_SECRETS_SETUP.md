# Railway CI/CD GitHub Secrets Configuration

This document provides step-by-step instructions for configuring the required GitHub Secrets for Railway CI/CD deployments.

## Required Secrets

You need to configure the following secrets in your GitHub repository:

### 1. RAILWAY_TOKEN (Required for all deployments)
- **Purpose**: Authenticates GitHub Actions with Railway
- **Scope**: Used by both staging and production workflows
- **Type**: Project Token (recommended) or Personal Token

### 2. RAILWAY_STAGING_SERVICE_NAME (Required for staging)
- **Purpose**: Identifies the staging service to deploy to
- **Format**: Service name as shown in Railway dashboard
- **Example**: `creator-ai-studio-staging`

### 3. RAILWAY_PROD_SERVICE_ID (Required for production)
- **Purpose**: Identifies the production service to deploy to
- **Format**: Service UUID from Railway
- **Example**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## Step-by-Step Setup Instructions

### Step 1: Obtain Railway Token

#### Option A: Project Token (Recommended for CI/CD)

1. Go to your Railway project dashboard: https://railway.app/dashboard
2. Select your project
3. Click on **Settings** in the left sidebar
4. Scroll to **Tokens** section
5. Click **Create Token**
6. Give it a descriptive name (e.g., "GitHub Actions CI/CD")
7. Copy the token immediately (it won't be shown again)

#### Option B: Personal Token (Alternative)

1. Go to Railway account settings: https://railway.app/account/tokens
2. Click **Create Token**
3. Give it a descriptive name
4. Copy the token immediately

**⚠️ Security Note**: Project tokens are preferred as they have limited scope to a single project.

---

### Step 2: Find Railway Service Name (Staging)

1. Go to your Railway project dashboard
2. Navigate to your **staging environment**
3. Click on your service
4. The service name is displayed at the top of the page
5. Copy the exact service name (case-sensitive)

**Example**: If your service is called `creator-ai-studio-staging`, use that exact string.

---

### Step 3: Find Railway Service ID (Production)

1. Go to your Railway project dashboard
2. Navigate to your **production environment**
3. Click on your service
4. Look at the URL in your browser - it will look like:
   ```
   https://railway.app/project/{project-id}/service/{service-id}
   ```
5. Copy the `{service-id}` portion (the UUID after `/service/`)

**Example URL**:
```
https://railway.app/project/abc123/service/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```
**Service ID**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

### Step 4: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:

#### Add RAILWAY_TOKEN:
- **Name**: `RAILWAY_TOKEN`
- **Value**: Paste the token from Step 1
- Click **Add secret**

#### Add RAILWAY_STAGING_SERVICE_NAME:
- **Name**: `RAILWAY_STAGING_SERVICE_NAME`
- **Value**: Paste the service name from Step 2
- Click **Add secret**

#### Add RAILWAY_PROD_SERVICE_ID:
- **Name**: `RAILWAY_PROD_SERVICE_ID`
- **Value**: Paste the service ID from Step 3
- Click **Add secret**

---

## Verification Checklist

Use this checklist to verify your secrets are configured correctly:

- [ ] **RAILWAY_TOKEN** is set in GitHub Secrets
- [ ] **RAILWAY_STAGING_SERVICE_NAME** is set in GitHub Secrets
- [ ] **RAILWAY_PROD_SERVICE_ID** is set in GitHub Secrets
- [ ] Railway token has not expired
- [ ] Railway token has access to the project
- [ ] Service names/IDs match exactly (case-sensitive)
- [ ] No extra spaces or characters in secret values

---

## Testing Your Configuration

### Test Staging Deployment:
1. Push a commit to the `dev` branch
2. Go to **Actions** tab in GitHub
3. Watch the "Deploy to Staging" workflow
4. Check for authentication success in logs

### Test Production Deployment:
1. Push a commit to the `main` branch
2. Go to **Actions** tab in GitHub
3. Watch the "Deploy to Production" workflow
4. Check for authentication success in logs

---

## Troubleshooting

### Error: "RAILWAY_TOKEN is not set"
- **Cause**: Secret not configured or misspelled
- **Fix**: Verify secret name is exactly `RAILWAY_TOKEN` (case-sensitive)

### Error: "Authentication failed"
- **Cause**: Invalid or expired token
- **Fix**: Generate a new token and update the secret

### Error: "Service not found"
- **Cause**: Incorrect service name or ID
- **Fix**: Double-check the service name/ID from Railway dashboard

### Error: "Permission denied"
- **Cause**: Token doesn't have access to the project
- **Fix**: Use a project token or ensure personal token has project access

---

## Security Best Practices

1. **Never commit tokens to git**: Always use GitHub Secrets
2. **Use project tokens**: Limit scope to specific projects
3. **Rotate tokens regularly**: Update tokens every 90 days
4. **Limit token access**: Only give tokens necessary permissions
5. **Monitor usage**: Check Railway logs for unauthorized access

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Documentation](https://docs.railway.app/develop/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Railway Project Tokens](https://docs.railway.app/reference/project-tokens)

---

## Quick Reference

| Secret Name | Purpose | Where to Find |
|------------|---------|---------------|
| `RAILWAY_TOKEN` | Authentication | Railway Project Settings → Tokens |
| `RAILWAY_STAGING_SERVICE_NAME` | Staging service identifier | Railway Dashboard → Service Name |
| `RAILWAY_PROD_SERVICE_ID` | Production service identifier | Railway Dashboard → Service URL |

---

**Last Updated**: January 2026
**Maintained By**: DevOps Team
