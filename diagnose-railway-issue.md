# Diagnosing Railway 500 Error

## Current Status

The fix has been pushed to the dev branch, but the server is still returning a 500 error. This could be due to:

1. **Railway hasn't deployed yet** - Wait 2-3 more minutes
2. **Database connection issue** - DATABASE_URL not set or incorrect
3. **PostgreSQL service not running** - Check Railway dashboard

## Immediate Actions

### 1. Check Railway Deployment Status

Go to Railway dashboard:
```
https://railway.app/dashboard
```

Look for:
- ✅ Latest deployment from dev branch
- ✅ Build completed successfully
- ✅ Service is running

### 2. Check Railway Logs

```bash
railway logs --service creator-dev-server-staging
```

Look for these messages:

**Good Signs:**
```
✅ Using DATABASE_URL from environment
✅ Database connection successful
Server listening on port 5000
```

**Bad Signs:**
```
❌ Database connection attempt failed
❌ ECONNREFUSED
❌ SSL connection error
```

### 3. Verify Environment Variables

In Railway dashboard, check that these are set:

**Required:**
- `DATABASE_URL` - Should be set automatically by PostgreSQL service
- `NODE_ENV=production`
- `JWT_SECRET` - Your JWT secret
- `JWT_REFRESH_SECRET` - Your refresh token secret

**Optional but recommended:**
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

### 4. Check PostgreSQL Service

In Railway dashboard:
1. Go to your project
2. Find the PostgreSQL service
3. Check it's running
4. Verify it's linked to your app service

### 5. Manual Database Connection Test

If you have Railway CLI installed:

```bash
# Connect to your database
railway connect postgres

# Once connected, check if users table exists
\dt

# Check users table structure
\d users

# Exit
\q
```

## Common Issues & Solutions

### Issue 1: DATABASE_URL Not Set

**Solution:**
1. Go to Railway dashboard
2. Click on your PostgreSQL service
3. Go to "Variables" tab
4. Copy the `DATABASE_URL`
5. Go to your app service
6. Add `DATABASE_URL` variable with the copied value

### Issue 2: SSL Connection Error

**Solution:**
The fix we deployed should handle this, but if it persists:

1. Check that `NODE_ENV=production` is set
2. Verify DATABASE_URL includes SSL parameters
3. DATABASE_URL should look like:
   ```
   postgresql://user:pass@host:port/db?sslmode=require
   ```

### Issue 3: Railway Hasn't Deployed Latest Code

**Solution:**
1. Go to Railway dashboard
2. Find your service
3. Click "Deployments"
4. Check if latest commit is deployed
5. If not, click "Redeploy" on the latest commit

### Issue 4: Database Migration Issues

**Solution:**
```bash
# Run migrations manually
railway run npm run db:push
```

## Testing After Fixes

Once you've made changes, wait 2-3 minutes and run:

```powershell
.\test-registration-fix.ps1
```

## Getting More Information

### Check Server Logs in Real-Time

```bash
railway logs --follow
```

### Check Database Connection

```bash
railway run node -e "const postgres = require('postgres'); const sql = postgres(process.env.DATABASE_URL); sql\`SELECT 1\`.then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e))"
```

### Test Registration Manually with Verbose Output

```bash
curl -v -X POST https://creator-dev-server-staging.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Next Steps

1. **Check Railway dashboard** - Verify deployment status
2. **Check Railway logs** - Look for error messages
3. **Verify DATABASE_URL** - Make sure it's set correctly
4. **Wait if needed** - Railway deployments can take 3-5 minutes
5. **Redeploy if necessary** - Force a new deployment from Railway dashboard

## Contact Points

If issues persist after checking all of the above:

1. **Railway Support** - Check Railway status page
2. **Database Logs** - Check PostgreSQL service logs in Railway
3. **Application Logs** - Check full application logs for stack traces

## Quick Checklist

- [ ] Railway deployment completed
- [ ] Latest commit is deployed
- [ ] Service is running (not crashed)
- [ ] DATABASE_URL is set
- [ ] PostgreSQL service is running
- [ ] No errors in Railway logs
- [ ] JWT secrets are set
- [ ] NODE_ENV=production is set

---

**Note:** The most common issue is that Railway hasn't finished deploying the latest changes. Wait 3-5 minutes after pushing and check the deployment status in the Railway dashboard.
