# Quick GitHub Secrets Setup

## 🚀 Add These Secrets to Your GitHub Repository

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

### Required Secrets:

1. **RAILWAY_TOKEN**
   ```
   7bea4487-4542-4542-a02e-a40888c4b2b8
   ```

2. **RAILWAY_PROJECT_ID**
   ```
   711091cc-10bf-41a3-87cf-8d058419de4f
   ```

3. **RAILWAY_STAGING_SERVICE_ID**
   ```
   01abc727-2496-4948-95e7-c05f629936e8
   ```

4. **RAILWAY_PROD_SERVICE_ID**
   ```
   db7499d8-fa40-476e-a943-9d62370bf3a8
   ```

## 📋 Steps:

1. Go to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret above (name and value)
6. Click **Add secret** for each one

## ✅ Verification:

After adding all secrets, your CI/CD pipeline will work correctly for:
- ✅ Staging deployments (dev branch → Railway staging)
- ✅ Production deployments (main branch → Railway production)

## 🔧 Test the Pipeline:

1. Push to `dev` branch → triggers staging deployment
2. Push to `main` branch → triggers production deployment
3. Check GitHub Actions tab for deployment status