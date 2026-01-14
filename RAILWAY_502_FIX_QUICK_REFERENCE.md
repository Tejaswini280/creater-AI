# Railway 502 Fix - Quick Reference Card

## Problem
✗ Application starts successfully but Railway shows 502 Bad Gateway  
✗ Healthcheck fails: "1/1 replicas never became healthy"  
✗ Logs show: "🔒 Redirecting HTTP to HTTPS in production" (repeated)

## Root Cause
**Infinite redirect loop on healthcheck endpoints**

Railway → HTTP healthcheck → Express redirects to HTTPS → Railway forwards as HTTP → Express redirects again → ♾️ LOOP

## Solution
**Register healthcheck endpoints BEFORE HTTPS redirect middleware**

```typescript
// ✅ CORRECT ORDER
app.get('/health', ...);        // 1. Healthcheck first
app.get('/api/health', ...);    // 2. Healthcheck first
app.use(httpsRedirect);         // 3. HTTPS redirect after
```

```typescript
// ✗ WRONG ORDER (causes 502)
app.use(httpsRedirect);         // 1. HTTPS redirect first
app.get('/health', ...);        // 2. Healthcheck after (TOO LATE!)
app.get('/api/health', ...);    // 3. Healthcheck after (TOO LATE!)
```

## Files Changed
- `server/index.ts` (middleware order only)

## Changes Made
1. ✅ Always trust proxy: `app.set('trust proxy', 1)`
2. ✅ Healthcheck endpoints registered BEFORE redirect middleware
3. ✅ Simplified HTTPS redirect logic
4. ✅ Removed duplicate healthcheck registration

## Deploy
```bash
./deploy-railway-healthcheck-fix.ps1
```

Or manually:
```bash
git add server/index.ts
git commit -m "fix(railway): resolve 502 by preventing healthcheck redirect loop"
git push origin main
```

## Verify
```bash
# Local test
curl http://localhost:5000/api/health  # Should return 200

# Railway test
curl https://your-app.railway.app/api/health  # Should return 200
```

## Expected Result
✅ Healthcheck returns 200  
✅ Railway marks service as healthy  
✅ No more 502 Bad Gateway  
✅ HTTPS still enforced for browser traffic  
✅ No redirect loops

## Why This Works
- Healthcheck endpoints are matched BEFORE redirect middleware
- They return 200 immediately without any redirects
- Browser requests still go through redirect middleware (HTTPS enforced)
- Railway's healthcheck succeeds → service marked healthy → traffic routed

## Key Insight
**Railway terminates HTTPS at the edge and forwards HTTP to your container.**

Your app receives HTTP traffic even though users access via HTTPS. You must:
1. Trust the `x-forwarded-proto` header
2. Never redirect healthcheck endpoints
3. Register healthchecks before redirect middleware

---

**Status:** ✅ FIX COMPLETE - READY FOR DEPLOYMENT
