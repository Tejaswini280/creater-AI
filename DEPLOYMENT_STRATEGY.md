# Dual-Mode Deployment Strategy

This project supports both **automatic** and **manual** deployment modes for maximum flexibility.

## Automatic Deployment (Recommended)

### Staging (Development)
- **Trigger**: Push to `dev` branch
- **Process**: Automatic via GitHub Actions
- **Environment**: Staging
- **Use Case**: Development testing, feature validation

### Production (Live)
- **Trigger**: Push to `main` branch  
- **Process**: Automatic via GitHub Actions
- **Environment**: Production
- **Use Case**: Live user-facing deployments

## Manual Deployment (Advanced)

### When to Use Manual Deployment
- **Hotfixes**: Critical bug fixes that need immediate deployment
- **Rollbacks**: Reverting to previous versions
- **Testing**: Deploying specific commits for testing
- **Emergency**: When GitHub Actions is unavailable

### Manual Deployment Commands

#### Prerequisites
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

#### Deploy to Staging
```bash
# Deploy current branch to staging
railway up --service=srv_your_staging_service_id

# Deploy specific commit to staging
git checkout <commit-hash>
railway up --service=srv_your_staging_service_id
```

#### Deploy to Production
```bash
# Deploy current branch to production (BE CAREFUL!)
railway up --service=srv_your_production_service_id

# Deploy specific commit to production
git checkout <commit-hash>
railway up --service=srv_your_production_service_id
```

#### Rollback Commands
```bash
# List recent deployments
railway status --service=srv_your_production_service_id

# Rollback to previous deployment
railway rollback --service=srv_your_production_service_id
```

## Deployment Workflow Comparison

| Feature | Automatic | Manual |
|---------|-----------|--------|
| **Speed** | Slower (full CI/CD) | Faster (direct deploy) |
| **Safety** | High (tests, checks) | Lower (no validation) |
| **Traceability** | Full logs | Limited logs |
| **Best For** | Regular deployments | Emergency fixes |

## Branch Strategy

```
main (production)
├── dev (staging)
│   ├── feature/new-ai-tool
│   ├── feature/ui-improvements
│   └── bugfix/scheduler-fix
└── hotfix/critical-security-patch
```

### Workflow
1. **Feature Development**: `feature/xyz` → `dev` → staging deployment
2. **Testing**: Validate on staging environment
3. **Release**: `dev` → `main` → production deployment
4. **Hotfixes**: `hotfix/xyz` → `main` → immediate production deployment

## Environment Differences

| Aspect | Staging | Production |
|--------|---------|------------|
| **Database** | Staging DB | Production DB |
| **API Keys** | Test/Staging keys | Production keys |
| **Rate Limits** | Relaxed | Strict |
| **Logging** | Verbose | Optimized |
| **Monitoring** | Basic | Full monitoring |

## Security Considerations

### Automatic Deployments
- ✅ Full test suite execution
- ✅ Security vulnerability scanning
- ✅ Build verification
- ✅ Environment isolation

### Manual Deployments
- ⚠️ No automatic testing
- ⚠️ No security scanning
- ⚠️ Direct access required
- ⚠️ Higher risk of errors

## Best Practices

1. **Use Automatic for Regular Deployments**
   - Safer and more reliable
   - Full audit trail
   - Consistent process

2. **Reserve Manual for Emergencies**
   - Critical hotfixes only
   - When GitHub Actions is down
   - Rollback scenarios

3. **Always Test Before Production**
   - Deploy to staging first
   - Validate functionality
   - Check performance

4. **Monitor After Deployment**
   - Check application health
   - Monitor error rates
   - Verify key features

## Troubleshooting

### GitHub Actions Deployment Fails
```bash
# Check Railway service status
railway status --service=srv_your_service_id

# View Railway logs
railway logs --service=srv_your_service_id

# Manual deployment as fallback
railway up --service=srv_your_service_id
```

### Manual Deployment Issues
```bash
# Check Railway CLI connection
railway whoami

# Re-authenticate if needed
railway logout
railway login

# Check service configuration
railway variables --service=srv_your_service_id
```

This dual-mode strategy ensures you always have a deployment path available while maintaining safety and reliability.