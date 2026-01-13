# Complete Railway Deployment Guide

## 🎯 Quick Start (3 Steps)

### Step 1: Authenticate with Railway
```powershell
.\fix-railway-auth.ps1
```

### Step 2: Verify Setup
```powershell
.\test-railway-setup.ps1
```

### Step 3: Deploy
```powershell
.\deploy-railway-staging-auth-fix.ps1
```

That's it! Your application will be deployed to Railway staging.

---

## 📋 Detailed Setup Guide

### Prerequisites

- ✅ Node.js 20+ installed
- ✅ npm installed
- ✅ Railway account created
- ✅ Git repository set up

### 1. Install Railway CLI

```powershell
npm install -g @railway/cli
```

Verify installation:
```powershell
railway --version
```

### 2. Authenticate Locally

Run the authentication fix script:
```powershell
.\fix-railway-auth.ps1
```

This will:
- Check if Railway CLI is installed
- Clear any corrupted authentication
- Guide you through authentication (browser or token)
- Verify successful authentication

**Alternative:** Manual authentication
```powershell
railway login
```

### 3. Set Up GitHub Secrets

For automated deployments via GitHub Actions:

1. Get your Railway token: https://railway.app/account/tokens
2. Go to your GitHub repository
3. Navigate to: **Settings** → **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add:
   - Name: `RAILWAY_TOKEN`
   - Value: Your Railway token

See detailed instructions: [GITHUB_SECRETS_QUICK_SETUP.md](./GITHUB_SECRETS_QUICK_SETUP.md)

### 4. Verify Configuration

Run the verification script:
```powershell
.\test-railway-setup.ps1
```

This checks:
- ✅ Railway CLI installation
- ✅ Authentication status
- ✅ Environment files
- ✅ Project configuration
- ✅ GitHub workflow setup
- ✅ Dependencies

### 5. Deploy

#### Local Deployment (Staging)
```powershell
.\deploy-railway-staging-auth-fix.ps1
```

#### Local Deployment (Production)
```powershell
.\scripts\deploy\setup.ps1 deploy production
```

#### Automated Deployment (GitHub Actions)
Push to the appropriate branch:
- **Staging:** Push to `dev` branch
- **Production:** Push to `main` branch

---

## 🔧 Troubleshooting

### Issue: "Process completed with exit code 1"

**Cause:** Not authenticated or authentication expired

**Solution:**
```powershell
.\fix-railway-auth.ps1
```

### Issue: "railway: command not found"

**Cause:** Railway CLI not installed or not in PATH

**Solution:**
```powershell
npm install -g @railway/cli
# Restart PowerShell
```

### Issue: "Unauthorized" or "Invalid token"

**Cause:** Token expired or invalid

**Solution:**
1. Logout: `railway logout`
2. Re-authenticate: `.\fix-railway-auth.ps1`
3. Update GitHub secret if using CI/CD

### Issue: "No project linked"

**Cause:** Not linked to Railway project

**Solution:**
```powershell
railway link 3ff6be5c-ffda-42e0-ab78-80d34b0c871b --environment b0101648-5024-4c3e-bafb-8bd0ef1e124b
```

### Issue: GitHub Actions deployment fails

**Cause:** Missing or invalid `RAILWAY_TOKEN` secret

**Solution:**
1. Verify secret exists in GitHub repository settings
2. Generate new token: https://railway.app/account/tokens
3. Update GitHub secret with new token

---

## 📁 Project Structure

### Deployment Scripts

| Script | Purpose |
|--------|---------|
| `fix-railway-auth.ps1` | Fix authentication issues |
| `deploy-railway-staging-auth-fix.ps1` | Deploy to staging with auth handling |
| `scripts/deploy/setup.ps1` | Full-featured deployment script |
| `test-railway-setup.ps1` | Verify setup and configuration |

### Documentation

| File | Description |
|------|-------------|
| `RAILWAY_AUTH_TROUBLESHOOTING.md` | Comprehensive auth troubleshooting |
| `RAILWAY_DEPLOYMENT_FIX.md` | Quick fix for deployment issues |
| `GITHUB_SECRETS_QUICK_SETUP.md` | GitHub secrets setup guide |
| `DEPLOYMENT_COMPLETE_GUIDE.md` | This file |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env.staging` | Staging environment variables |
| `.env.production` | Production environment variables |
| `railway.json` | Railway service configuration |
| `.github/workflows/staging-deploy.yml` | Staging deployment workflow |
| `.github/workflows/production-deploy.yml` | Production deployment workflow |

---

## 🚀 Deployment Workflows

### Local Development → Staging

1. Make changes locally
2. Test locally: `npm run dev`
3. Commit changes: `git commit -am "Your changes"`
4. Push to dev: `git push origin dev`
5. GitHub Actions automatically deploys to staging
6. Monitor: https://railway.app/project/3ff6be5c-ffda-42e0-ab78-80d34b0c871b

### Staging → Production

1. Test thoroughly on staging
2. Merge dev to main: `git checkout main && git merge dev`
3. Push to main: `git push origin main`
4. GitHub Actions automatically deploys to production
5. Monitor deployment in Railway dashboard

### Manual Deployment

#### Staging
```powershell
.\deploy-railway-staging-auth-fix.ps1
```

#### Production
```powershell
.\scripts\deploy\setup.ps1 deploy production
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Use Railway tokens for CI/CD
- Store tokens in GitHub Secrets
- Use browser login for local development
- Rotate tokens periodically
- Use different tokens for different projects
- Keep `.env` files out of git (already in `.gitignore`)

### ❌ DON'T:
- Commit tokens to repository
- Share tokens in chat or email
- Use the same token everywhere
- Store tokens in code
- Push `.env` files to git

---

## 📊 Railway Project Configuration

### Project Details
- **Project ID:** `3ff6be5c-ffda-42e0-ab78-80d34b0c871b`
- **Dashboard:** https://railway.app/project/3ff6be5c-ffda-42e0-ab78-80d34b0c871b

### Staging Environment
- **Environment ID:** `b0101648-5024-4c3e-bafb-8bd0ef1e124b`
- **Service ID:** `c6fb59a7-7d9b-4e0f-9061-770c9d9e7fa3`
- **Branch:** `dev`

### Production Environment
- **Environment ID:** `0115af74-72b3-48ed-a9a7-b39dbbde0fc2`
- **Service ID:** `c1771311-72e3-4cd9-9284-9815f508d66b`
- **Branch:** `main`

---

## 🧪 Testing Deployment

### Verify Staging Deployment

1. Check Railway dashboard
2. View logs: `railway logs --environment b0101648-5024-4c3e-bafb-8bd0ef1e124b`
3. Test health endpoint: `curl https://your-staging-url.railway.app/api/health`
4. Test application functionality

### Verify Production Deployment

1. Check Railway dashboard
2. View logs: `railway logs --environment 0115af74-72b3-48ed-a9a7-b39dbbde0fc2`
3. Test health endpoint: `curl https://your-production-url.railway.app/api/health`
4. Monitor for errors

---

## 📞 Support & Resources

### Documentation
- Railway CLI: https://docs.railway.app/develop/cli
- Railway Dashboard: https://railway.app/project/3ff6be5c-ffda-42e0-ab78-80d34b0c871b
- API Tokens: https://railway.app/account/tokens

### Status & Health
- Railway Status: https://status.railway.app/
- Application Health: `/api/health` endpoint

### Troubleshooting Guides
- [RAILWAY_AUTH_TROUBLESHOOTING.md](./RAILWAY_AUTH_TROUBLESHOOTING.md)
- [RAILWAY_DEPLOYMENT_FIX.md](./RAILWAY_DEPLOYMENT_FIX.md)
- [GITHUB_SECRETS_QUICK_SETUP.md](./GITHUB_SECRETS_QUICK_SETUP.md)

---

## 🎓 Common Commands Reference

### Authentication
```powershell
# Login (browser)
railway login

# Login (token)
$env:RAILWAY_TOKEN = "your-token"
railway whoami

# Logout
railway logout
```

### Project Management
```powershell
# Link to project
railway link 3ff6be5c-ffda-42e0-ab78-80d34b0c871b

# Check status
railway status

# List environments
railway environment
```

### Deployment
```powershell
# Deploy to staging
railway up --service c6fb59a7-7d9b-4e0f-9061-770c9d9e7fa3 --environment b0101648-5024-4c3e-bafb-8bd0ef1e124b

# Deploy to production
railway up --service c1771311-72e3-4cd9-9284-9815f508d66b --environment 0115af74-72b3-48ed-a9a7-b39dbbde0fc2
```

### Monitoring
```powershell
# View logs (staging)
railway logs --environment b0101648-5024-4c3e-bafb-8bd0ef1e124b

# View logs (production)
railway logs --environment 0115af74-72b3-48ed-a9a7-b39dbbde0fc2

# Follow logs
railway logs --follow
```

### Variables
```powershell
# List variables
railway variables

# Set variable
railway variables --set KEY=VALUE

# Set from file
railway variables --set-from-file .env.staging
```

---

## ✅ Deployment Checklist

### Before First Deployment

- [ ] Railway CLI installed
- [ ] Authenticated with Railway
- [ ] GitHub secrets configured
- [ ] Environment files created (`.env.staging`, `.env.production`)
- [ ] Dependencies installed (`npm install`)
- [ ] Application builds successfully (`npm run build`)
- [ ] Tests pass (`npm test`)

### Before Each Deployment

- [ ] Code committed to git
- [ ] Tests passing locally
- [ ] Environment variables updated (if needed)
- [ ] Database migrations ready (if any)
- [ ] Staging tested (for production deployments)

### After Deployment

- [ ] Check Railway dashboard for deployment status
- [ ] Verify application is running
- [ ] Test critical functionality
- [ ] Monitor logs for errors
- [ ] Update documentation (if needed)

---

## 🎉 Success!

If you've followed this guide, your application should now be:

✅ Authenticated with Railway  
✅ Configured for automated deployments  
✅ Deployed to staging environment  
✅ Ready for production deployment  

**Next Steps:**
1. Test your staging environment thoroughly
2. Set up monitoring and alerts
3. Configure custom domains (if needed)
4. Deploy to production when ready

Happy deploying! 🚀
