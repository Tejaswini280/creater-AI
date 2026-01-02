# Railway API Keys Fix - URGENT

## 🚨 Issue
Your application is crashing in production because the OpenAI API key is missing from the Railway environment variables.

## 🔧 Immediate Fix (5 minutes)

### Step 1: Access Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Sign in to your account
3. Navigate to your project (Creator AI Studio)

### Step 2: Set Environment Variables
1. Click on your service/deployment
2. Go to the **"Variables"** tab
3. Add the following environment variables:

```
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
GEMINI_API_KEY=your-actual-gemini-api-key-here
SESSION_SECRET=your-secure-random-session-secret-here
JWT_SECRET=your-secure-random-jwt-secret-here
JWT_REFRESH_SECRET=your-secure-random-refresh-secret-here
```

### Step 3: Get Your API Keys

#### OpenAI API Key:
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign in to your OpenAI account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

#### Gemini API Key:
1. Go to [makersuite.google.com](https://makersuite.google.com)
2. Sign in with your Google account
3. Get your API key
4. Copy the key

### Step 4: Generate Secure Secrets
Run this command locally to generate secure secrets:
```bash
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'));"
```

### Step 5: Redeploy
1. After setting all environment variables in Railway
2. Click **"Deploy"** or trigger a new deployment
3. Your application should start successfully

## 🔍 Verification

After deployment, check your Railway logs. You should see:
- ✅ Database connection successful
- ✅ No OpenAI API key errors
- ✅ Server starting on port 5000

## 🛡️ Security Notes

- Never commit API keys to your code repository
- Use Railway's environment variables for all sensitive data
- Rotate your API keys regularly
- Monitor your API usage and costs

## 📞 If You Still Have Issues

1. Check Railway logs for specific error messages
2. Verify all environment variables are set correctly
3. Ensure your API keys are valid and have sufficient credits
4. Contact Railway support if deployment issues persist

## 🚀 Alternative: Quick Local Test

To test locally with proper API keys:
1. Update your `.env` file with real API keys
2. Run `npm run dev`
3. Verify everything works locally before deploying

---

**This fix should resolve your production deployment issue immediately!**