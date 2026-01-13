# Railway Authentication Troubleshooting Guide

## Issue: Deployment Fails with Exit Code 1

This guide helps resolve Railway CLI authentication and deployment issues on Windows.

## Common Causes

1. **Not authenticated** - Railway CLI requires authentication before deployment
2. **Expired session** - Authentication token may have expired
3. **Corrupted credentials** - Stored credentials may be invalid
4. **Wrong project/environment** - Not linked to correct Railway project

## Quick Fix

Run the authentication fix script:

```powershell
.\fix-railway-auth.ps1
```

This script will:
- Check Railway CLI installation
- Clear any corrupted authentication state
- Guide you through re-authentication
- Verify successful authentication

## Manual Steps

### 1. Check Railway CLI Installation

```powershell
railway --version
```

If not installed:

```powershell
npm install -g @railway/cli
```

### 2. Check Authentication Status

```powershell
railway whoami
```

**Expected output:** Your Railway username/email

**If error:** You need to authenticate

### 3. Authenticate

#### Option A: Browser Login (Recommended)

```powershell
railway login
```

This will:
1. Open your browser
2. Prompt you to log in to Railway
3. Automatically save credentials

#### Option B: Token Authentication

1. Get your token from: https://railway.app/account/tokens
2. Set environment variable:

```powershell
$env:RAILWAY_TOKEN = "your-token-here"
```

3. Verify:

```powershell
railway whoami
```

### 4. Link to Project

```powershell
railway link 3ff6be5c-ffda-42e0-ab78-80d34b0c871b
```

Or use the deployment script:

```powershell
.\deploy-railway-staging-auth-fix.ps1
```

## Deployment Scripts

### For Staging

```powershell
.\deploy-railway-staging-auth-fix.ps1
```

This script handles:
- Authentication verification
- Project linking
- Environment variable setup
- Deployment to staging

### For Production

```powershell
.\scripts\deploy\setup.ps1 deploy production
```

## Environment Variables

### Save Token Permanently

Add to `.env` file:

```env
RAILWAY_TOKEN=your-token-here
```

### Load Token in PowerShell

```powershell
# Load from .env
Get-Content .env | ForEach-Object {
    if ($_ -match '^RAILWAY_TOKEN=(.*)$') {
        $env:RAILWAY_TOKEN = $matches[1]
    }
}
```

## Common Errors and Solutions

### Error: "Process completed with exit code 1"

**Cause:** Not authenticated or authentication expired

**Solution:**
```powershell
railway logout
railway login
```

### Error: "No project linked"

**Cause:** Not linked to Railway project

**Solution:**
```powershell
railway link 3ff6be5c-ffda-42e0-ab78-80d34b0c871b --environment b0101648-5024-4c3e-bafb-8bd0ef1e124b
```

### Error: "Unauthorized"

**Cause:** Invalid or expired token

**Solution:**
1. Clear token: `railway logout`
2. Re-authenticate: `railway login`
3. Verify: `railway whoami`

### Error: "Command not found: railway"

**Cause:** Railway CLI not installed or not in PATH

**Solution:**
```powershell
npm install -g @railway/cli
```

If still not found, restart PowerShell.

## Verification Steps

After authentication, verify everything works:

```powershell
# 1. Check authentication
railway whoami

# 2. Check project status
railway status

# 3. List environments
railway environment

# 4. Test deployment (dry run)
railway up --help
```

## CI/CD Authentication

For GitHub Actions or automated deployments:

1. Generate a token: https://railway.app/account/tokens
2. Add as GitHub secret: `RAILWAY_TOKEN`
3. Use in workflow:

```yaml
- name: Deploy to Railway
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: railway up --service ${{ env.SERVICE_ID }}
```

## Project Configuration

Your Railway project details:

- **Project ID:** `3ff6be5c-ffda-42e0-ab78-80d34b0c871b`
- **Staging Environment:** `b0101648-5024-4c3e-bafb-8bd0ef1e124b`
- **Staging Service:** `c6fb59a7-7d9b-4e0f-9061-770c9d9e7fa3`
- **Production Environment:** `0115af74-72b3-48ed-a9a7-b39dbbde0fc2`
- **Production Service:** `c1771311-72e3-4cd9-9284-9815f508d66b`

## Best Practices

1. **Use token authentication for CI/CD** - More reliable for automated deployments
2. **Use browser login for local development** - Easier and more secure
3. **Store tokens securely** - Never commit tokens to git
4. **Verify authentication before deployment** - Run `railway whoami` first
5. **Use environment-specific commands** - Always specify `--environment` flag

## Additional Resources

- Railway CLI Documentation: https://docs.railway.app/develop/cli
- Railway Dashboard: https://railway.app/project/3ff6be5c-ffda-42e0-ab78-80d34b0c871b
- Get API Token: https://railway.app/account/tokens

## Support

If issues persist:

1. Check Railway status: https://status.railway.app/
2. Review Railway logs: `railway logs`
3. Contact Railway support: https://railway.app/help
4. Check GitHub Actions logs for detailed error messages

## Quick Reference

```powershell
# Authentication
railway login                    # Browser login
railway logout                   # Clear credentials
railway whoami                   # Check current user

# Project Management
railway link <project-id>        # Link to project
railway status                   # Show project status
railway environment              # List environments

# Deployment
railway up                       # Deploy current directory
railway up --service <id>        # Deploy specific service
railway up --environment <id>    # Deploy to specific environment

# Variables
railway variables                # List variables
railway variables --set KEY=VAL  # Set variable

# Logs
railway logs                     # View logs
railway logs --follow            # Follow logs in real-time
```
