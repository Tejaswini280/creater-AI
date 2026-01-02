# Railway First-Time Setup Guide

## Prerequisites
- GitHub account with your repository
- Railway account (sign up at https://railway.app)

## Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Login with GitHub"
3. Authorize Railway to access your GitHub account
4. Complete account setup

## Step 2: Create Railway Project
1. In Railway dashboard, click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `Tejaswini280/creater-AI`
4. Railway will create a project and attempt to deploy

## Step 3: Create Two Services (Staging & Production)

### Create Staging Service
1. In your Railway project, click "New Service"
2. Select "GitHub Repo"
3. Choose your repository again
4. Name it: `creater-ai-staging`
5. Set branch to: `dev`
6. Click "Deploy"

### Create Production Service  
1. Click "New Service" again
2. Select "GitHub Repo" 
3. Choose your repository
4. Name it: `creater-ai-production`
5. Set branch to: `main`
6. Click "Deploy"

## Step 4: Get Required IDs and Tokens

### Get Railway Token
1. Go to Railway dashboard
2. Click your profile (top right)
3. Select "Account Settings"
4. Go to "Tokens" tab
5. Click "Create Token"
6. Name it: `GitHub-Actions-Token`
7. Copy the token (save it securely)

### Get Service IDs
1. Go to your Railway project
2. Click on **Staging Service**
3. Go to "Settings" tab
4. Copy the "Service ID" (starts with `srv_`)
5. Repeat for **Production Service**

### Get Project ID (if needed)
1. In Railway project dashboard
2. Go to "Settings"
3. Copy "Project ID" (starts with `prj_`)

## Step 5: Add GitHub Secrets
1. Go to your GitHub repository
2. Click "Settings" tab
3. Go to "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Add these secrets:

```
RAILWAY_TOKEN = your_railway_token_here
RAILWAY_STAGING_SERVICE_ID = srv_staging_id_here  
RAILWAY_PROD_SERVICE_ID = srv_production_id_here
```

## Step 6: Configure Environment Variables in Railway

### For Staging Service:
1. Go to Railway → Your Project → Staging Service
2. Click "Variables" tab
3. Add these variables:
```
NODE_ENV=staging
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
SESSION_SECRET=staging-secret-key
JWT_SECRET=staging-jwt-secret
```

### For Production Service:
1. Go to Railway → Your Project → Production Service  
2. Click "Variables" tab
3. Add these variables:
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=your_production_openai_key
GEMINI_API_KEY=your_production_gemini_key
SESSION_SECRET=production-secret-key
JWT_SECRET=production-jwt-secret
```

## Step 7: Add PostgreSQL Database
1. In Railway project, click "New Service"
2. Select "Database" → "PostgreSQL"
3. Railway will create a database
4. Both staging and production services can reference it via `${{Postgres.DATABASE_URL}}`

## Verification
- Check that both services deploy successfully
- Verify environment variables are set
- Test that GitHub Actions can deploy using the secrets

Your Railway setup is now complete and ready for CI/CD!