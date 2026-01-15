# Railway JWT Environment Variables Setup Guide

## 🚨 Critical: Set These Variables in Railway

To fix the JWT token expiry error permanently, you **MUST** set these environment variables in your Railway project.

## 📋 Required Environment Variables

Add these to your Railway project's environment variables:

```bash
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

## 🔧 How to Set Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Login to your account

2. **Select Your Project**
   - Click on "Creator-Dev-Server" (or your project name)

3. **Open Variables Tab**
   - Click on your service (e.g., "Creator-Dev-Server-staging")
   - Click on the "Variables" tab

4. **Add Variables**
   - Click "+ New Variable"
   - Add each variable one by one:
     ```
     JWT_EXPIRES_IN = 15m
     JWT_REFRESH_EXPIRES_IN = 7d
     ACCESS_TOKEN_EXPIRY = 15m
     REFRESH_TOKEN_EXPIRY = 7d
     ```

5. **Deploy**
   - Railway will automatically trigger a redeploy
   - Wait 2-3 minutes for deployment to complete

### Method 2: Railway CLI

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set variables
railway variables set JWT_EXPIRES_IN=15m
railway variables set JWT_REFRESH_EXPIRES_IN=7d
railway variables set ACCESS_TOKEN_EXPIRY=15m
railway variables set REFRESH_TOKEN_EXPIRY=7d

# Trigger redeploy
railway up
```

## 🎯 Variable Explanations

| Variable | Value | Purpose |
|----------|-------|---------|
| `JWT_EXPIRES_IN` | `15m` | Access token expires in 15 minutes (primary) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token expires in 7 days (primary) |
| `ACCESS_TOKEN_EXPIRY` | `15m` | Access token expires in 15 minutes (fallback) |
| `REFRESH_TOKEN_EXPIRY` | `7d` | Refresh token expires in 7 days (fallback) |

### Why Two Sets of Variables?

The code checks **both** variable names for maximum compatibility:
```typescript
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || process.env.JWT_EXPIRES_IN || "15m";
```

This ensures the fix works regardless of which naming convention you use.

## ⏱️ Recommended Expiry Times

### Development/Staging
```bash
JWT_EXPIRES_IN=15m          # Short for security
JWT_REFRESH_EXPIRES_IN=7d   # Convenient for testing
```

### Production
```bash
JWT_EXPIRES_IN=15m          # Short for security
JWT_REFRESH_EXPIRES_IN=7d   # Balance security & UX
```

### High Security Production
```bash
JWT_EXPIRES_IN=5m           # Very short
JWT_REFRESH_EXPIRES_IN=1d   # Require daily re-auth
```

## 🔍 Verification

After setting variables and redeploying:

### 1. Check Railway Logs
```bash
railway logs
```

Look for:
- ✅ No JWT signing errors
- ✅ No validation warnings
- ✅ Successful login attempts

### 2. Test Login
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Expected response:
```json
{
  "message": "Login successful",
  "user": { ... },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Check Environment Variables
```bash
railway variables
```

Verify all 4 variables are set correctly.

## 🚨 Troubleshooting

### Issue: Still getting JWT errors after setting variables

**Solution:**
1. Verify variables are set in the correct service
2. Check for typos in variable names
3. Ensure Railway has redeployed (check deployment logs)
4. Try manual redeploy: `railway up`

### Issue: Variables not showing in logs

**Solution:**
1. Railway may take 1-2 minutes to apply variables
2. Check the "Deployments" tab for status
3. Look for "Environment variables updated" event

### Issue: Login works but tokens expire too quickly

**Solution:**
1. Increase `JWT_EXPIRES_IN` value (e.g., `30m`, `1h`)
2. Redeploy and test again

## 📊 Monitoring

After deployment, monitor these metrics:

1. **Authentication Success Rate**
   - Should be > 95%
   - Track failed login attempts

2. **JWT Signing Errors**
   - Should be 0
   - Alert if any occur

3. **Token Refresh Rate**
   - Normal: Users refresh tokens before expiry
   - High rate may indicate expiry is too short

## 🔐 Security Best Practices

1. **Keep Access Tokens Short**
   - 5-15 minutes is recommended
   - Reduces risk if token is compromised

2. **Refresh Tokens Can Be Longer**
   - 7 days is a good balance
   - Consider user convenience vs security

3. **Use HTTPS Only**
   - Railway provides this by default
   - Never send tokens over HTTP

4. **Rotate Secrets Regularly**
   - Change `JWT_SECRET` periodically
   - Invalidates all existing tokens

## ✅ Checklist

Before marking this as complete:

- [ ] All 4 environment variables set in Railway
- [ ] Railway has redeployed successfully
- [ ] Login tested and working
- [ ] No JWT errors in logs
- [ ] Tokens have correct expiry times
- [ ] Refresh token flow working
- [ ] Monitoring alerts configured

## 📞 Support

If you still have issues after following this guide:

1. Check Railway deployment logs
2. Review `JWT_EXPIRY_ROOT_CAUSE_PERMANENT_FIX.md`
3. Run verification: `node verify-jwt-expiry-fix.cjs`
4. Check Railway community forums

---

**Last Updated**: 2026-01-15
**Status**: ✅ Production Ready
**Priority**: 🔴 Critical
