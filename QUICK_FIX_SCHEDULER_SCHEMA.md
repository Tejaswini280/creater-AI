# 🚨 Quick Fix: Scheduler Schema Error

## Error
```
❌ column "content_type" does not exist
```

## Fix (Choose One)

### 🚀 Option 1: Git Deploy (5 min)
```bash
git add .
git commit -m "fix: scheduler schema"
git push origin dev
# Wait for Railway deployment
```

### 🔧 Option 2: Direct DB (2 min)
```bash
railway connect postgres
\i migrations/0031_fix_scheduler_schema_permanent.sql
\q
railway up
```

### 🤖 Option 3: Script (3 min)
```bash
export DATABASE_URL="your_url"
node fix-scheduler-schema-permanent.cjs
railway up
```

## Verify
```bash
node verify-scheduler-schema-fix.cjs
```

## Success
```
✅ Database schema verified - all 11 required columns present
✅ Content Scheduler Service initialized successfully
```

## Help
- Full docs: `SCHEDULER_SCHEMA_FIX_COMPLETE.md`
- Quick guide: `DEPLOY_SCHEDULER_FIX_NOW.md`
- Summary: `SCHEDULER_SCHEMA_PERMANENT_FIX_SUMMARY.md`

---

**Status**: ✅ Ready to Deploy  
**Priority**: 🚨 Critical  
**Time**: 2-5 minutes
