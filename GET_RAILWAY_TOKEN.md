# How to Get Your Railway Token

## Steps:

1. **Go to Railway Account Settings**
   - Visit: https://railway.app/account/tokens

2. **Create a New Token**
   - Click "Create Token"
   - Give it a name like "CLI Deployment"
   - Copy the token (you'll only see it once!)

3. **Set the Token in PowerShell**
   ```powershell
   $env:RAILWAY_TOKEN = "your-token-here"
   ```

4. **Verify it's set**
   ```powershell
   echo $env:RAILWAY_TOKEN
   ```

5. **Run the deployment**
   ```powershell
   .\deploy-to-staging-now.ps1
   ```

## Alternative: Use Railway CLI Login

If the browser login worked, try closing and reopening PowerShell, then run:
```powershell
railway whoami
```

If it still doesn't work, use the token method above.

## For GitHub Actions

The token is already set in your GitHub secrets as `RAILWAY_TOKEN`, so GitHub Actions deployments will work automatically when you push to the `dev` branch.
