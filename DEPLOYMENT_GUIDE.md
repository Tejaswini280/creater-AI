# 🚀 Creator AI Studio - Deployment Guide

## 📋 Complete Deployment Setup for Railway & GitHub Actions

This guide provides everything you need to deploy your Creator AI Studio application to Railway with automated CI/CD using GitHub Actions.

---

## 🗂️ Required Files (Already Created)

### ✅ Railway Configuration
- `railway.json` - Railway deployment configuration
- `nixpacks.toml` - Nixpacks build configuration
- `Dockerfile` - Container configuration (alternative to Nixpacks)

### ✅ GitHub Actions
- `.github/workflows/deploy.yml` - CI/CD pipeline
- `.dockerignore` - Docker build exclusions

### ✅ Environment Configuration
- `.env.production` - Production environment template

---

## 🌐 Environment Variables Required

### 🔑 Railway Environment Variables (Set in Railway Dashboard)

#### **Database (Automatic)**
```bash
# Railway PostgreSQL will automatically provide:
DATABASE_URL=postgresql://username:password@host:port/database
```

#### **AI API Keys (Required)**
```bash
OPENAI_API_KEY=sk-proj-your-openai-key
GEMINI_API_KEY=your-gemini-api-key
KLING_ACCESS_KEY=your-kling-access-key
KLING_SECRET_KEY=your-kling-secret-key
HUGGINGFACE_API_KEY=your-huggingface-key
```

#### **Security Secrets (Required)**
```bash
SESSION_SECRET=your-super-secure-session-secret-min-32-chars
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-jwt-refresh-secret-min-32-chars
```

#### **Application Settings**
```bash
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-app-name.railway.app
SECURE_COOKIES=true
TRUST_PROXY=true
SKIP_RATE_LIMIT=0
PERF_MODE=0
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## 🔧 GitHub Secrets Required

### Set these in GitHub Repository Settings > Secrets and Variables > Actions:

```bash
RAILWAY_TOKEN=your-railway-api-token
RAILWAY_SERVICE_ID=your-railway-service-id
```

---

## 🚀 Deployment Steps

### 1. **Setup Railway Account**
1. Go to [Railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Create new project
4. Add PostgreSQL database service

### 2. **Configure Railway Project**
1. Connect your GitHub repository
2. Select the `tk-final-Creator-AI` branch
3. Railway will auto-detect Node.js and use `nixpacks.toml`

### 3. **Set Environment Variables in Railway**
1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add all the environment variables listed above

### 4. **Get Railway Tokens**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Get your project info
railway status

# Get service ID
railway service
```

### 5. **Configure GitHub Secrets**
1. Go to your GitHub repository
2. Settings > Secrets and Variables > Actions
3. Add `RAILWAY_TOKEN` and `RAILWAY_SERVICE_ID`

### 6. **Deploy**
```bash
# Push to trigger deployment
git push origin tk-final-Creator-AI
```

---

## 📊 Database Setup

### Railway PostgreSQL Configuration
1. **Add PostgreSQL Service** in Railway dashboard
2. **Database URL** will be automatically provided
3. **Migrations** will run automatically on deployment

### Database Environment Variables (Auto-provided by Railway)
```bash
DATABASE_URL=postgresql://username:password@host:port/database
PGHOST=host
PGPORT=5432
PGDATABASE=railway
PGUSER=postgres
PGPASSWORD=password
```

---

## 🔐 Security Configuration

### Required Security Environment Variables
```bash
# Session Security (Generate strong secrets)
SESSION_SECRET=generate-32-char-random-string
JWT_SECRET=generate-32-char-random-string
JWT_REFRESH_SECRET=generate-32-char-random-string

# CORS Configuration
CORS_ORIGIN=https://your-app-name.railway.app

# Security Settings
SECURE_COOKIES=true
TRUST_PROXY=true
```

### Generate Secure Secrets
```bash
# Use Node.js to generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🤖 AI Services Configuration

### OpenAI API
```bash
OPENAI_API_KEY=sk-proj-your-openai-api-key
```
- Get from: [OpenAI Platform](https://platform.openai.com/api-keys)

### Google Gemini API
```bash
GEMINI_API_KEY=your-gemini-api-key
```
- Get from: [Google AI Studio](https://makersuite.google.com/app/apikey)

### Kling AI API
```bash
KLING_ACCESS_KEY=your-kling-access-key
KLING_SECRET_KEY=your-kling-secret-key
```
- Get from: [Kling AI Platform](https://klingai.kuaishou.com/)

### HuggingFace API
```bash
HUGGINGFACE_API_KEY=your-huggingface-api-key
```
- Get from: [HuggingFace Settings](https://huggingface.co/settings/tokens)

---

## 📁 File Structure for Deployment

### ✅ Essential Files (Already Created)
```
├── railway.json              # Railway configuration
├── nixpacks.toml            # Build configuration
├── Dockerfile               # Container configuration
├── .dockerignore            # Docker exclusions
├── .env.production          # Production environment template
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD pipeline
├── package.json             # Dependencies and scripts
├── server/                  # Backend code
├── client/                  # Frontend code
├── shared/                  # Shared utilities
└── dist/                    # Built application (generated)
```

### ✅ Build Process
1. **Install dependencies:** `npm ci`
2. **Build frontend:** `vite build`
3. **Build backend:** `esbuild server/index.ts`
4. **Start production:** `npm start`

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
1. **Test Phase:**
   - Run TypeScript checks
   - Run unit tests
   - Run security tests

2. **Build Phase:**
   - Build application
   - Upload artifacts

3. **Deploy Phase:**
   - Deploy to Railway
   - Health check verification

### Deployment Triggers
- **Automatic:** Push to `main` or `tk-final-Creator-AI` branch
- **Manual:** GitHub Actions workflow dispatch

---

## 🏥 Health Checks & Monitoring

### Health Check Endpoint
```bash
GET /api/health
```

### Railway Health Check Configuration
```json
{
  "healthcheckPath": "/api/health",
  "healthcheckTimeout": 300,
  "restartPolicyType": "ON_FAILURE",
  "restartPolicyMaxRetries": 10
}
```

---

## 🚀 Quick Deployment Checklist

### ✅ Pre-Deployment
- [ ] Railway account created
- [ ] PostgreSQL service added to Railway project
- [ ] GitHub repository connected to Railway
- [ ] All environment variables set in Railway
- [ ] GitHub secrets configured
- [ ] API keys obtained and configured

### ✅ Deployment
- [ ] Push code to `tk-final-Creator-AI` branch
- [ ] GitHub Actions pipeline runs successfully
- [ ] Railway deployment completes
- [ ] Health check passes
- [ ] Application accessible at Railway URL

### ✅ Post-Deployment
- [ ] Test all major features
- [ ] Verify AI integrations work
- [ ] Check auto-scheduling functionality
- [ ] Monitor application logs
- [ ] Set up custom domain (optional)

---

## 🎯 Expected Deployment URL

Your application will be available at:
```
https://your-app-name.railway.app
```

---

## 📞 Support & Troubleshooting

### Common Issues
1. **Build Failures:** Check environment variables
2. **Database Connection:** Verify DATABASE_URL
3. **API Errors:** Check AI API keys
4. **Health Check Fails:** Verify /api/health endpoint

### Logs Access
```bash
# Railway CLI
railway logs

# Or check Railway dashboard logs section
```

---

## 🎉 Success!

Once deployed, your Creator AI Studio will be live with:
- ✅ Auto-scheduling system
- ✅ AI content generation
- ✅ Social media integration
- ✅ Analytics dashboard
- ✅ All platform features

**Your production-ready Creator AI Studio is now live on Railway!** 🚀