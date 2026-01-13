# GitHub Secrets Quick Setup Guide

## Required Secrets for Railway Deployment

Your GitHub Actions workflow needs the following secret to deploy to Railway:

### 1. RAILWAY_TOKEN (Required)

This is your Railway API token that allows GitHub Actions to authenticate and deploy.

#### How to Get Your Railway Token:

1. Go to https://railway.app/account/tokens
2. Click "Create Token"
3. Give it a name like "GitHub Actions - Creator AI Studio"
4. Copy the token (you'll only see it once!)

#### How to Add to GitHub:

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `RAILWAY_TOKEN`
5. Value: Paste your Railway token
6. Click **Add secret**

## Verification

After adding the secret, you can verify it's working:

1. Go to **Actions** tab in your repository
2. Find the latest "Deploy to Staging" workflow run
3. Check if it shows the secret is available (it will show as `***`)

## Current Configuration

Your workflow is configured with these Railway IDs:

- **Project ID:** `3ff6be5c-ffda-42e0-ab78-80d34b0c871b`
- **Staging Environment ID:** `b0101648-5024-4c3e-bafb-8bd0ef1e124b`
- **Staging Service ID:** `c6fb59a7-7d9b-4e0f-9061-770c9d9e7fa3`
- **Production Environment ID:** `0115af74-72b3-48ed-a9a7-b39dbbde0fc2`
- **Production Service ID:** `c1771311-72e3-4cd9-9284-9815f508d66b`

These are hardcoded in the workflow, so you only need to add the `RAILWAY_TOKEN` secret.

## Testing the Setup

After adding the secret:

1. Push a commit to the `dev` branch
2. Go to **Actions** tab
3. Watch the "Deploy to Staging" workflow run
4. It should now authenticate successfully and deploy

## Troubleshooting

### Error: "RAILWAY_TOKEN not found"

**Solution:** Make sure you added the secret with the exact name `RAILWAY_TOKEN` (case-sensitive)

### Error: "Unauthorized" or "Invalid token"

**Solution:** 
1. Generate a new token at https://railway.app/account/tokens
2. Update the GitHub secret with the new token

### Error: "railway: command not found"

**Solution:** This shouldn't happen as the workflow installs Railway CLI automatically. If it does, the workflow needs to be updated.

## Security Best Practices

✅ **DO:**
- Keep your Railway token secret
- Use GitHub Secrets for sensitive data
- Rotate tokens periodically
- Use different tokens for different projects

❌ **DON'T:**
- Commit tokens to your repository
- Share tokens in chat or email
- Use the same token across multiple projects
- Store tokens in code or configuration files

## Additional Secrets (Optional)

If you want to add more secrets for other services:

### Database Secrets
- `DATABASE_URL` - Production database connection string
- `DATABASE_URL_STAGING` - Staging database connection string

### API Keys
- `GEMINI_API_KEY` - Google Gemini API key
- `OPENAI_API_KEY` - OpenAI API key

### Other Services
- `CLOUDINARY_URL` - Cloudinary configuration
- `REDIS_URL` - Redis connection string

## Quick Reference

```bash
# Get Railway token
https://railway.app/account/tokens

# Add GitHub secret
Repository → Settings → Secrets and variables → Actions → New repository secret

# Test deployment
git push origin dev
```

## Support

If you continue to have issues:

1. Check Railway status: https://status.railway.app/
2. Verify token is valid: Run `railway whoami` locally with the token
3. Check GitHub Actions logs for detailed error messages
4. Review Railway deployment logs in the Railway dashboard

## Next Steps

After setting up the secret:

1. ✅ Add `RAILWAY_TOKEN` to GitHub Secrets
2. ✅ Push to `dev` branch to trigger deployment
3. ✅ Monitor deployment in GitHub Actions
4. ✅ Verify deployment in Railway dashboard
5. ✅ Test your staging environment

Your deployment should now work automatically! 🚀
