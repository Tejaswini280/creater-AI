# Railway CI/CD Deployment Guide

Complete guide for deploying Creator AI Studio to Railway using GitHub Actions CI/CD pipelines.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Deployment Workflows](#deployment-workflows)
5. [Workflow Triggers](#workflow-triggers)
6. [Troubleshooting](#troubleshooting)
7. [Deployment Checklist](#deployment-checklist)

---

## Overview

This project uses GitHub Actions to automatically deploy to Railway:

- **Staging Environment**: Deploys automatically when code is pushed to `dev` branch
- **Production Environment**: Deploys automatically when code is pushed to `main` branch

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   GitHub    │─────▶│GitHub Actions│─────▶│   Railway   │
│ Repository  │      │   Workflow   │      │  Platform   │
└─────────────┘      └──────────────┘      └─────────────┘
     │                      │                      │
     │                      │                      │
  Push to              Run Tests              Deploy App
  dev/main            Build App              Run Migrations
                   Deploy to Railway        Health Checks
```

---

## Prerequisites

Before you can deploy, ensure you have:

### 1. Railway Account & Project
- [ ] Railway account created at https://railway.app
- [ ] Project created in Railway
- [ ] Staging and Production environments set up
- [ ] PostgreSQL database provisioned for each environment

### 2. GitHub Repository
- [ ] Repository with code pushed to GitHub
- [ ] Access to repository settings (admin or maintainer role)

### 3. Required Secrets
- [ ] `RAILWAY_TOKEN` - Railway authentication token
- [ ] `RAILWAY_STAGING_SERVICE_NAME` - Staging service name
- [ ] `RAILWAY_PROD_SERVICE_ID` - Production service ID

**See [RAILWAY_CICD_SECRETS_SETUP.md](./RAILWAY_CICD_SECRETS_SETUP.md) for detailed setup instructions.**

---

## Initial Setup

### Step 1: Configure Railway Services

#### Staging Environment:
1. Go to Railway dashboard
2. Create or select your staging environment
3. Add a service for your application
4. Note the service name (e.g., `creator-ai-studio-staging`)
5. Configure environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL` (auto-provided by Railway)
   - Add any other required environment variables

#### Production Environment:
1. Go to Railway dashboard
2. Create or select your production environment
3. Add a service for your application
4. Note the service ID from the URL
5. Configure environment variables (same as staging)

### Step 2: Configure GitHub Secrets

Follow the instructions in [RAILWAY_CICD_SECRETS_SETUP.md](./RAILWAY_CICD_SECRETS_SETUP.md) to add:
- `RAILWAY_TOKEN`
- `RAILWAY_STAGING_SERVICE_NAME`
- `RAILWAY_PROD_SERVICE_ID`

### Step 3: Verify Configuration Files

Ensure these files exist in your repository:

#### `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

#### `nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci --production=false"]

[phases.build]
cmds = ["npm run railway:build"]

[start]
cmd = "npm run start"
```

---

## Deployment Workflows

### Staging Deployment Workflow

**File**: `.github/workflows/staging-deploy.yml`

**Trigger**: Push to `dev` branch

**Steps**:
1. **Run Tests**: Execute test suite with PostgreSQL
2. **Build Application**: Build client and server code
3. **Deploy to Railway**: Deploy to staging environment
4. **Notify**: Send deployment status notification

**Workflow Diagram**:
```
Push to dev
    ↓
Run Tests (PostgreSQL service)
    ↓
Build Application
    ↓
Deploy to Railway Staging
    ↓
Notify Success/Failure
```

### Production Deployment Workflow

**File**: `.github/workflows/production-deploy.yml`

**Trigger**: Push to `main` branch

**Steps**:
1. **Run Tests**: Execute test suite with PostgreSQL
2. **Build Application**: Build client and server code
3. **Deploy to Railway**: Deploy to production environment
4. **Wait for Deployment**: Wait 90 seconds for deployment
5. **Verify Health**: Check deployment status
6. **Notify**: Send deployment status notification

**Workflow Diagram**:
```
Push to main
    ↓
Run Tests (PostgreSQL service)
    ↓
Build Application
    ↓
Deploy to Railway Production
    ↓
Wait for Deployment (90s)
    ↓
Verify Health Check
    ↓
Notify Success/Failure
```

---

## Workflow Triggers

### Automatic Triggers

#### Staging:
- **Branch**: `dev`
- **Event**: `push`
- **Example**: `git push origin dev`

#### Production:
- **Branch**: `main`
- **Event**: `push`
- **Example**: `git push origin main`

### Manual Triggers

Both workflows support manual triggering via GitHub Actions UI:

1. Go to **Actions** tab in GitHub
2. Select the workflow (Staging or Production)
3. Click **Run workflow**
4. Optionally enable "Force deployment even if tests fail"
5. Click **Run workflow** button

**Use Cases for Manual Triggers**:
- Hotfix deployments
- Re-deploying after fixing configuration
- Testing deployment pipeline
- Deploying without new commits

---

## Troubleshooting

### Common Issues

#### 1. Authentication Failed

**Error**: `RAILWAY_TOKEN is not set` or `Authentication failed`

**Causes**:
- Secret not configured
- Token expired
- Token doesn't have project access

**Solutions**:
1. Verify `RAILWAY_TOKEN` is set in GitHub Secrets
2. Generate a new token in Railway
3. Update the secret in GitHub
4. Ensure token has access to the project

---

#### 2. Service Not Found

**Error**: `Service not found` or `Failed to link service`

**Causes**:
- Incorrect service name/ID
- Service doesn't exist
- Token doesn't have access to service

**Solutions**:
1. Verify service name/ID in Railway dashboard
2. Check for typos (case-sensitive)
3. Ensure service exists in the correct environment
4. Verify token has access to the service

---

#### 3. Database Migration Failure

**Error**: `Migration failed` or `Column already exists`

**Causes**:
- Migration file has errors
- Database schema mismatch
- Missing columns referenced in COMMENT statements

**Solutions**:
1. Check migration file syntax
2. Ensure migrations are idempotent (use `IF NOT EXISTS`)
3. Add columns BEFORE adding comments
4. Test migrations locally first

---

#### 4. Build Failure

**Error**: `Build failed` or `npm run build failed`

**Causes**:
- TypeScript errors
- Missing dependencies
- Build script errors

**Solutions**:
1. Run `npm run check` locally
2. Run `npm run build` locally
3. Fix TypeScript errors
4. Ensure all dependencies are in package.json

---

#### 5. Health Check Timeout

**Error**: `Health check failed` or `Deployment timeout`

**Causes**:
- Application not starting
- Health check endpoint not responding
- Database connection issues

**Solutions**:
1. Check Railway logs for startup errors
2. Verify `/api/health` endpoint exists
3. Check database connection string
4. Increase health check timeout in railway.json

---

#### 6. Tests Failing in CI

**Error**: `Tests failed` or `Test suite failed`

**Causes**:
- Environment-specific issues
- Database connection issues
- Missing test environment variables

**Solutions**:
1. Run tests locally: `npm test`
2. Check PostgreSQL service is running in CI
3. Verify `DATABASE_URL` is set correctly
4. Check for race conditions in tests

---

### Debugging Steps

#### 1. Check GitHub Actions Logs
1. Go to **Actions** tab
2. Click on the failed workflow run
3. Expand failed steps
4. Look for error messages

#### 2. Check Railway Logs
1. Go to Railway dashboard
2. Select your service
3. Click **Deployments** tab
4. Click on the latest deployment
5. View build and runtime logs

#### 3. Verify Secrets
1. Go to repository **Settings**
2. Click **Secrets and variables** → **Actions**
3. Verify all required secrets are present
4. Check for typos or extra spaces

#### 4. Test Locally
```bash
# Test build
npm run build

# Test migrations
npm run db:migrate

# Test application
npm run start

# Test health endpoint
curl http://localhost:5000/api/health
```

---

## Deployment Checklist

Use this checklist before deploying:

### Pre-Deployment

- [ ] All tests pass locally (`npm test`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] TypeScript check passes (`npm run check`)
- [ ] Database migrations tested locally
- [ ] Environment variables configured in Railway
- [ ] GitHub secrets configured correctly
- [ ] Railway services are running

### Staging Deployment

- [ ] Code merged to `dev` branch
- [ ] GitHub Actions workflow triggered
- [ ] Tests passed in CI
- [ ] Build succeeded in CI
- [ ] Deployment to Railway succeeded
- [ ] Application is accessible
- [ ] Health check endpoint responding
- [ ] Database migrations completed
- [ ] Smoke tests passed

### Production Deployment

- [ ] Staging deployment verified
- [ ] Code reviewed and approved
- [ ] Code merged to `main` branch
- [ ] GitHub Actions workflow triggered
- [ ] Tests passed in CI
- [ ] Build succeeded in CI
- [ ] Deployment to Railway succeeded
- [ ] Health check passed
- [ ] Application is accessible
- [ ] Database migrations completed
- [ ] Production smoke tests passed
- [ ] Monitoring alerts configured

### Post-Deployment

- [ ] Application is responding correctly
- [ ] No errors in Railway logs
- [ ] Database queries working
- [ ] API endpoints responding
- [ ] Frontend loading correctly
- [ ] User authentication working
- [ ] Critical features tested
- [ ] Performance metrics normal

---

## Best Practices

### 1. Branch Strategy
- Use `dev` for staging deployments
- Use `main` for production deployments
- Create feature branches from `dev`
- Merge to `dev` first, then to `main`

### 2. Testing
- Always run tests locally before pushing
- Fix failing tests before merging
- Use manual trigger with force deploy only for emergencies

### 3. Migrations
- Test migrations on staging first
- Make migrations idempotent
- Use `IF NOT EXISTS` and `IF EXISTS` clauses
- Add columns before adding comments

### 4. Monitoring
- Check Railway logs after deployment
- Monitor health check endpoint
- Set up alerts for failures
- Review deployment metrics

### 5. Rollback
- Keep previous deployments available
- Document rollback procedures
- Test rollback process
- Have a rollback plan ready

---

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway CLI Documentation](https://docs.railway.app/develop/cli)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nixpacks Documentation](https://nixpacks.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Support

### Getting Help

1. **Check Documentation**: Review this guide and Railway docs
2. **Check Logs**: Review GitHub Actions and Railway logs
3. **Search Issues**: Check GitHub issues for similar problems
4. **Ask Team**: Reach out to team members
5. **Railway Support**: Contact Railway support if needed

### Useful Commands

```bash
# Check Railway CLI version
railway --version

# Login to Railway
railway login

# Check current project
railway whoami

# View service status
railway status

# View logs
railway logs

# Run command in Railway environment
railway run <command>
```

---

**Last Updated**: January 2026
**Maintained By**: DevOps Team
