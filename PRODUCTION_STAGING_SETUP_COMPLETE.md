# 🚀 Complete Production + Staging Setup Guide

## 📋 **Overview**

You'll set up:
- **Production Environment** (main branch) - Live users
- **Staging Environment** (dev branch) - Testing and development

## ✅ **STEP 1: Railway Project Setup**

### 1.1 Create Railway Account & Project
1. Go to https://railway.app
2. Login with GitHub
3. Create new project from your repository: `Tejaswini280/creater-AI`

### 1.2 Add Shared Database
1. In Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. This database will be shared between staging and production

### 1.3 Create Production Service
1. Click "New Service" → "GitHub Repo"
2. Choose your repository
3. **Service Name**: `creater-ai-production`
4. **Branch**: `main`
5. **Environment**: `production`
6. Click "Deploy"

### 1.4 Create Staging Service
1. Click "New Service" → "GitHub Repo"
2. Choose your repository again
3. **Service Name**: `creater-ai-staging`
4. **Branch**: `dev`
5. **Environment**: `staging`
6. Click "Deploy"

---

## ✅ **STEP 2: Get Railway Credentials**

### 2.1 Railway Token
1. Railway Dashboard → Profile → Account Settings
2. Tokens tab → Create Token
3. Name: `GitHub-Actions-CI-CD`
4. **SAVE THIS TOKEN**: `railway_xxxxxxxxxxxxxxxx`

### 2.2 Service IDs
**Production Service ID:**
1. Go to Production Service → Settings
2. Copy "Service ID": `srv_xxxxxxxxxxxxxxxx`

**Staging Service ID:**
1. Go to Staging Service → Settings
2. Copy "Service ID": `srv_xxxxxxxxxxxxxxxx`

---

## ✅ **STEP 3: Configure GitHub Secrets**

Go to: https://github.com/Tejaswini280/creater-AI/settings/secrets/actions

Add these 3 secrets:

| Secret Name | Value | Purpose |
|-------------|-------|---------|
| `RAILWAY_TOKEN` | `railway_your_token_here` | Deploy access |
| `RAILWAY_STAGING_SERVICE_ID` | `srv_staging_id_here` | Staging deployment |
| `RAILWAY_PROD_SERVICE_ID` | `srv_production_id_here` | Production deployment |

---

## ✅ **STEP 4: Environment Variables Setup**

### 4.1 Production Environment Variables
Go to: Railway → Production Service → Variables

```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}

# AI API Keys (Production)
OPENAI_API_KEY=sk-prod-your-production-openai-key
GEMINI_API_KEY=your-production-gemini-key

# Additional AI Services
KLING_ACCESS_KEY=your-production-kling-access-key
KLING_SECRET_KEY=your-production-kling-secret-key
HUGGINGFACE_API_KEY=your-production-huggingface-key

# Security (MUST BE SECURE)
SESSION_SECRET=CHANGE-TO-SECURE-RANDOM-STRING-64-CHARS-PRODUCTION
JWT_SECRET=CHANGE-TO-SECURE-JWT-SECRET-64-CHARS-PRODUCTION
JWT_REFRESH_SECRET=CHANGE-TO-SECURE-REFRESH-SECRET-64-CHARS-PRODUCTION

# Production Settings
SKIP_RATE_LIMIT=0
PERF_MODE=0
HTTPS_ONLY=true
SECURE_COOKIES=true
```

### 4.2 Staging Environment Variables
Go to: Railway → Staging Service → Variables

```env
NODE_ENV=staging
DATABASE_URL=${{Postgres.DATABASE_URL}}

# AI API Keys (Staging - can be same as production or separate)
OPENAI_API_KEY=sk-staging-your-staging-openai-key
GEMINI_API_KEY=your-staging-gemini-key

# Additional AI Services
KLING_ACCESS_KEY=your-staging-kling-access-key
KLING_SECRET_KEY=your-staging-kling-secret-key
HUGGINGFACE_API_KEY=your-staging-huggingface-key

# Security (Different from production)
SESSION_SECRET=CreatorNexus-Staging-Secret-2024-Random-String
JWT_SECRET=CreatorNexus-JWT-Staging-Secret-2024-Random
JWT_REFRESH_SECRET=CreatorNexus-Refresh-Staging-Secret-2024

# Staging Settings
SKIP_RATE_LIMIT=0
PERF_MODE=0
```

---

## ✅ **STEP 5: Create Dev Branch for Staging**

```bash
# Create and switch to dev branch
git checkout -b dev

# Push dev branch to GitHub
git push -u origin dev
```

---

## ✅ **STEP 6: Test Your CI/CD Pipeline**

### 6.1 Test Staging Deployment
```bash
# Make a test change on dev branch
git checkout dev
echo "# Staging Test" >> staging-test.md
git add staging-test.md
git commit -m "test: staging deployment pipeline"
git push origin dev

# This should trigger staging deployment automatically
```

### 6.2 Test Production Deployment
```bash
# After staging test succeeds, merge to main
git checkout main
git merge dev
git push origin main

# This should trigger production deployment automatically
```

---

## ✅ **STEP 7: Verify Deployments**

### 7.1 Check GitHub Actions
1. Go to: https://github.com/Tejaswini280/creater-AI/actions
2. Verify workflows are running:
   - `Deploy to Staging` (triggered by dev push)
   - `Deploy to Production` (triggered by main push)

### 7.2 Check Railway Deployments
1. **Staging Service**: Should show successful deployment
2. **Production Service**: Should show successful deployment
3. Both should have green health checks

### 7.3 Test Applications
1. **Staging URL**: Get from Railway staging service
2. **Production URL**: Get from Railway production service
3. Both should load and respond to `/api/health`

---

## ✅ **STEP 8: API Keys Setup**

### 8.1 OpenAI API Keys
1. Go to: https://platform.openai.com/api-keys
2. Create separate keys for staging and production
3. Add to respective Railway services

### 8.2 Gemini API Keys
1. Go to: https://aistudio.google.com/app/apikey
2. Create API key
3. Can use same key for both or create separate ones

### 8.3 Additional Services (Optional)
- **Kling AI**: https://klingai.kuaishou.com/
- **Hugging Face**: https://huggingface.co/settings/tokens

---

## 🔄 **Deployment Workflow**

### Development Workflow
```
feature/new-feature → dev → staging deployment
                      ↓
                    testing
                      ↓
                  dev → main → production deployment
```

### Branch Strategy
- `feature/*` → `dev` (staging)
- `dev` → `main` (production)
- `hotfix/*` → `main` (emergency production)

---

## 📊 **Monitoring & Health Checks**

### Health Endpoints
- **Staging**: `https://staging-url.railway.app/api/health`
- **Production**: `https://production-url.railway.app/api/health`

### Database Health
- **Staging**: `https://staging-url.railway.app/api/db/perf`
- **Production**: `https://production-url.railway.app/api/db/perf`

---

## 🚨 **Security Checklist**

### Production Security
- [ ] Strong, unique SESSION_SECRET (64+ characters)
- [ ] Strong, unique JWT_SECRET (64+ characters)
- [ ] Strong, unique JWT_REFRESH_SECRET (64+ characters)
- [ ] Production API keys (not test keys)
- [ ] HTTPS_ONLY=true
- [ ] SECURE_COOKIES=true

### Staging Security
- [ ] Different secrets from production
- [ ] Can use test/staging API keys
- [ ] Less strict security for testing

---

## 🎯 **Success Criteria**

You'll know everything is working when:

### GitHub Actions
- [ ] Staging workflow runs on dev push
- [ ] Production workflow runs on main push
- [ ] Both workflows show green checkmarks

### Railway Services
- [ ] Staging service deployed and healthy
- [ ] Production service deployed and healthy
- [ ] Database connected to both services

### Applications
- [ ] Staging URL loads correctly
- [ ] Production URL loads correctly
- [ ] Health checks return 200 OK
- [ ] API endpoints respond

---

## 🛠️ **Troubleshooting**

### Common Issues

#### Deployment Fails
```bash
# Check Railway logs
railway logs --service=srv_your_service_id

# Check GitHub Actions logs
# Go to GitHub → Actions → Failed workflow
```

#### Health Check Fails
- Check environment variables are set
- Verify DATABASE_URL is configured
- Check Railway service logs

#### API Keys Not Working
- Verify keys are correctly formatted
- Check key permissions and quotas
- Ensure keys are added to correct environment

---

## 🎉 **Next Steps After Setup**

1. **Test staging environment** thoroughly
2. **Deploy to production** when staging is stable
3. **Set up monitoring** and alerts
4. **Configure branch protection** rules
5. **Train team** on deployment workflow

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the troubleshooting section above
2. Review Railway dashboard logs
3. Check GitHub Actions workflow logs
4. Ask for specific help with error messages

**Your production + staging setup is now complete! 🚀**