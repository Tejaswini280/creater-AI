# Admin Seed - Quick Start Guide

## 🚀 Quick Deploy (3 Steps)

### Step 1: Deploy the Code
```powershell
.\deploy-admin-seed.ps1
```

### Step 2: Wait for Railway (2-3 minutes)
Check Railway dashboard for deployment status

### Step 3: Run Seed on Railway
```bash
railway run node scripts/seed-admin-users.cjs
```

## 🔐 Login Credentials

**Admin User:**
- Email: `tejaswini.kawade@renaissa.ai`
- Password: `Intern2025#`

**Testing User:**
- Email: `tester@renaissa.ai`
- Password: `Intern2025#`

## ✅ Test Login

```powershell
.\test-admin-login.ps1
```

## 📋 Alternative: SQL Migration

```bash
railway run psql -d $DATABASE_URL -f migrations/0032_seed_admin_users.sql
```

## 🔍 Verify Users

```bash
railway run psql -c "SELECT email, first_name, last_name FROM users WHERE email LIKE '%renaissa.ai'"
```

## 🆘 Troubleshooting

### Login fails with 401?
```bash
# Re-run seed
railway run node scripts/seed-admin-users.cjs
```

### Need to regenerate hash?
```bash
node scripts/generate-admin-hash.cjs
```

### Check Railway logs?
```bash
railway logs
```

---

**Full Documentation:** See `ADMIN_SEED_DOCUMENTATION.md`
