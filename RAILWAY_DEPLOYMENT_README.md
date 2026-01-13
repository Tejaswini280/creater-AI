# Railway Deployment - Quick Reference

## 🎯 Having Deployment Issues?

**Read this first:** [START_HERE.md](./START_HERE.md)

---

## ⚡ Quick Commands

### First Time Setup
```powershell
.\fix-railway-auth.ps1                    # Authenticate with Railway
.\test-railway-setup.ps1                  # Verify configuration
.\deploy-railway-staging-auth-fix.ps1     # Deploy to staging
```

### Daily Use
```powershell
git push origin dev                       # Auto-deploy to staging
git push origin main                      # Auto-deploy to production
```

---

## 📚 Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[START_HERE.md](./START_HERE.md)** | Quick start guide | First time setup |
| **[RAILWAY_AUTH_FIX_SUMMARY.md](./RAILWAY_AUTH_FIX_SUMMARY.md)** | Problem overview | Understanding the fix |
| **[DEPLOYMENT_COMPLETE_GUIDE.md](./DEPLOYMENT_COMPLETE_GUIDE.md)** | Complete walkthrough | Detailed setup |
| **[RAILWAY_AUTH_TROUBLESHOOTING.md](./RAILWAY_AUTH_TROUBLESHOOTING.md)** | Troubleshooting | When things go wrong |
| **[GITHUB_SECRETS_QUICK_SETUP.md](./GITHUB_SECRETS_QUICK_SETUP.md)** | GitHub configuration | Setting up CI/CD |
| **[RAILWAY_DEPLOYMENT_FIX.md](./RAILWAY_DEPLOYMENT_FIX.md)** | Quick fixes | Common issues |

---

## 🛠️ Scripts

| Script | Purpose |
|--------|---------|
| `fix-railway-auth.ps1` | Fix authentication issues |
| `deploy-railway-staging-auth-fix.ps1` | Deploy to staging with auth handling |
| `scripts/deploy/setup.ps1` | Full deployment management tool |
| `test-railway-setup.ps1` | Verify your setup is correct |

---

## 🚨 Common Issues

### "Process completed with exit code 1"
**Solution:** Run `.\fix-railway-auth.ps1`

### "railway: command not found"
**Solution:** `npm install -g @railway/cli`

### "Not authenticated"
**Solution:** Run `.\fix-railway-auth.ps1`

### GitHub Actions failing
**Solution:** Add `RAILWAY_TOKEN` to GitHub Secrets  
**Guide:** [GITHUB_SECRETS_QUICK_SETUP.md](./GITHUB_SECRETS_QUICK_SETUP.md)

---

## 🔗 Quick Links

- **Railway Dashboard:** https://railway.app/project/3ff6be5c-ffda-42e0-ab78-80d34b0c871b
- **Get API Token:** https://railway.app/account/tokens
- **Railway Status:** https://status.railway.app/
- **Railway Docs:** https://docs.railway.app/

---

## ✅ Deployment Checklist

- [ ] Railway CLI installed
- [ ] Authenticated with Railway
- [ ] GitHub secret `RAILWAY_TOKEN` added
- [ ] Environment files configured
- [ ] Tests passing
- [ ] Ready to deploy!

---

**Start here:** [START_HERE.md](./START_HERE.md) 🚀
