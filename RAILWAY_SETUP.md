# 🚂 Railway Deployment Setup - Step by Step

## 🎯 Quick Setup Guide

### 1. **Create Railway Account**
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Verify your account

### 2. **Create New Project**
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `CreatorNexus` repository
4. Select `tk-final-Creator-AI` branch

### 3. **Add PostgreSQL Database**
1. In your project dashboard, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically provide `DATABASE_URL`

### 4. **Configure Environment Variables**

#### **Required API Keys:**
```bash
OPENAI_API_KEY=sk-proj-your-openai-key
GEMINI_API_KEY=your-gemini-api-key
KLING_ACCESS_KEY=your-kling-access-key
KLING_SECRET_KEY=your-kling-secret-key
HUGGINGFACE_API_KEY=your-huggingface-key
```

#### **Generate Security Secrets:**
```bash
# Run this command to generate secure secrets:
node scripts/generate-secrets.js
```

#### **Application Settings:**
```bash
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-app-name.railway.app
SECURE_COOKIES=true
TRUST_PROXY=true
```

### 5. **GitHub Actions Setup**

#### **Get Railway Tokens:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Get project info
railway status
```

#### **Add GitHub Secrets:**
1. Go to GitHub repository → Settings → Secrets and Variables → Actions
2. Add these secrets:
   - `RAILWAY_TOKEN`: Your Railway API token
   - `RAILWAY_SERVICE_ID`: Your Railway service ID

### 6. **Deploy**
```bash
# Push to trigger deployment
git push origin tk-final-Creator-AI
```

---

## 🔧 Environment Variables Checklist

### ✅ Database (Auto-provided by Railway)
- `DATABASE_URL` - Automatically set by Railway PostgreSQL

### ✅ AI Services (You need to set these)
- `OPENAI_API_KEY` - From OpenAI Platform
- `GEMINI_API_KEY` - From Google AI Studio  
- `KLING_ACCESS_KEY` - From Kling AI Platform
- `KLING_SECRET_KEY` - From Kling AI Platform
- `HUGGINGFACE_API_KEY` - From HuggingFace

### ✅ Security (Generate with script)
- `SESSION_SECRET` - Generate with `node scripts/generate-secrets.js`
- `JWT_SECRET` - Generate with `node scripts/generate-secrets.js`
- `JWT_REFRESH_SECRET` - Generate with `node scripts/generate-secrets.js`

### ✅ Application Settings
- `NODE_ENV=production`
- `PORT=5000`
- `CORS_ORIGIN=https://your-app-name.railway.app`
- `SECURE_COOKIES=true`
- `TRUST_PROXY=true`

---

## 🎯 Expected Result

After successful deployment:
- **URL:** `https://your-app-name.railway.app`
- **Features:** All Creator AI Studio features working
- **Database:** PostgreSQL connected and initialized
- **AI Services:** All AI integrations functional
- **Auto-Scheduling:** Working with optimal posting times

---

## 🚀 Quick Commands

```bash
# Generate secrets
node scripts/generate-secrets.js

# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Check deployment status
railway status

# View logs
railway logs

# Deploy manually (if needed)
railway up
```

---

## ✅ Deployment Verification

After deployment, test these endpoints:
- `GET /api/health` - Health check
- `GET /api/auto-schedule/optimal-times/instagram` - Auto-scheduling
- `POST /api/projects` - Project creation

Your Creator AI Studio will be live and ready for production use! 🎉