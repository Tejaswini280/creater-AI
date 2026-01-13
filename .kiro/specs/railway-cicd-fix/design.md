# Design Document: Railway CI/CD Deployment Fix

## Overview

This design addresses two critical issues preventing successful Railway deployments:
1. Database migration failure due to incorrect column references in COMMENT statements
2. Improper Railway CLI usage in GitHub Actions workflows

The solution implements Railway's official deployment method using the CLI Docker image and fixes the migration SQL to ensure idempotent, error-free execution.

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  Source Code   │  │  Workflows   │  │  Migrations    │ │
│  │  (dev/main)    │  │  (.github/)  │  │  (SQL files)   │ │
│  └────────┬───────┘  └──────┬───────┘  └────────┬───────┘ │
└───────────┼──────────────────┼──────────────────┼──────────┘
            │                  │                  │
            │ Push Event       │ Trigger          │
            ▼                  ▼                  │
┌─────────────────────────────────────────────────┼──────────┐
│              GitHub Actions Workflow             │          │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐ │          │
│  │   Test   │→ │   Build   │→ │    Deploy    │ │          │
│  │   Job    │  │    Job    │  │     Job      │ │          │
│  └──────────┘  └───────────┘  └──────┬───────┘ │          │
└────────────────────────────────────────┼─────────┘          │
                                         │                    │
                                         │ Railway CLI        │
                                         ▼                    │
┌─────────────────────────────────────────────────────────────┤
│                    Railway Platform                         │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Nixpacks     │→ │  Container   │→ │   PostgreSQL   │ │
│  │   Builder      │  │   Runtime    │  │   Database     │ │
│  └────────────────┘  └──────────────┘  └────────┬───────┘ │
│                                                   │         │
│                                                   │ Execute │
│                                                   ▼         │
│                                          ┌────────────────┐ │
│                                          │   Migrations   │ │
│                                          │    Runner      │ │
│                                          └────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Flow

```
Developer Push → GitHub Actions → Railway CLI → Railway Build → Deploy → Migrations → Health Check
```

## Components and Interfaces

### 1. Fixed Migration File (0003_additional_tables_safe.sql)

**Purpose**: Create additional tables and columns without errors

**Key Changes**:
- Add missing columns to `content` table BEFORE adding comments
- Remove invalid COMMENT statements referencing non-existent columns
- Ensure all ALTER TABLE statements use IF NOT EXISTS

**Interface**:
```sql
-- Add columns first
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_stopped BOOLEAN DEFAULT false;
ALTER TABLE content ADD COLUMN IF NOT EXISTS can_publish BOOLEAN DEFAULT true;
ALTER TABLE content ADD COLUMN IF NOT EXISTS publish_order INTEGER DEFAULT 0;
ALTER TABLE content ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;
ALTER TABLE content ADD COLUMN IF NOT EXISTS last_regenerated_at TIMESTAMP;

-- Then add comments
COMMENT ON COLUMN content.is_paused IS 'Individual content pause state';
COMMENT ON COLUMN content.is_stopped IS 'Individual content stop state';
```

### 2. Staging Deployment Workflow

**File**: `.github/workflows/staging-deploy.yml`

**Purpose**: Automated deployment to Railway staging environment on dev branch pushes

**Jobs**:
1. **test**: Run tests with PostgreSQL service container
2. **build**: Build the application
3. **deploy-staging**: Deploy to Railway using CLI
4. **notify**: Send deployment status notifications

**Railway CLI Usage**:
```yaml
- name: Deploy to Railway Staging
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: |
    echo "$RAILWAY_TOKEN" | railway login --browserless
    railway up --service "${{ secrets.RAILWAY_STAGING_SERVICE_NAME }}" --detach
```

**Key Configuration**:
- Uses official Railway CLI Docker image: `ghcr.io/railwayapp/cli:latest`
- Browserless authentication for CI environment
- Detached deployment for non-blocking execution
- Service-specific deployment using service name/ID

### 3. Production Deployment Workflow

**File**: `.github/workflows/production-deploy.yml`

**Purpose**: Automated deployment to Railway production environment on main branch pushes

**Jobs**:
1. **test**: Run comprehensive tests
2. **build**: Build production artifacts
3. **deploy-production**: Deploy to Railway production
4. **notify**: Send deployment status notifications

**Railway CLI Usage**:
```yaml
- name: Deploy to Railway Production
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
  run: |
    echo "$RAILWAY_TOKEN" | railway login --browserless
    railway link ${{ secrets.RAILWAY_PROD_SERVICE_ID }}
    railway up --detach
```

**Key Configuration**:
- Service linking using service ID for production
- Health check verification after deployment
- 90-second wait for deployment completion
- Status verification step

### 4. Railway Configuration Files

**railway.json**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 5
  }
}
```

**nixpacks.toml**:
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm ci --production=false"]

[phases.build]
cmds = ["npm run railway:build"]

[start]
cmd = "npm run start"

[variables]
NODE_ENV = "production"
```

## Data Models

### GitHub Secrets Structure

```typescript
interface GitHubSecrets {
  RAILWAY_TOKEN: string;              // Project token for Railway CLI authentication
  RAILWAY_STAGING_SERVICE_NAME: string; // Service name for staging environment
  RAILWAY_PROD_SERVICE_ID: string;    // Service ID for production environment
}
```

### Workflow Environment Variables

```typescript
interface WorkflowEnv {
  NODE_VERSION: string;               // Node.js version (20)
  NODE_ENV: string;                   // Environment (test/production)
  DATABASE_URL: string;               // PostgreSQL connection string
  SKIP_RATE_LIMIT: string;           // Skip rate limiting in tests (1)
  RAILWAY_TOKEN: string;              // Injected from secrets
  CI: string;                         // Auto-detected by Railway CLI (true)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Migration Idempotency
*For any* database state (fresh or partially migrated), running migration 0003_additional_tables_safe.sql multiple times should result in the same final schema without errors.

**Validates: Requirements 1.1, 1.2, 1.3, 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 2: Column Existence Before Comments
*For any* COMMENT statement in a migration, the referenced column must exist in the target table before the COMMENT is added.

**Validates: Requirements 1.2, 1.3**

### Property 3: Railway CLI Authentication Success
*For any* valid RAILWAY_TOKEN, the browserless login command should authenticate successfully and allow subsequent railway commands to execute.

**Validates: Requirements 2.2, 2.5, 5.4**

### Property 4: Service-Specific Deployment
*For any* Railway service ID or service name, the `railway up --service=<id>` command should deploy only to that specific service without affecting other services.

**Validates: Requirements 2.3, 2.4**

### Property 5: Workflow Trigger Correctness
*For any* push to the dev branch, the staging workflow should trigger, and for any push to the main branch, the production workflow should trigger.

**Validates: Requirements 3.1, 4.1**

### Property 6: Test Execution Before Deployment
*For any* workflow run (staging or production), tests must execute and pass before the deployment job starts, unless force_deploy is true.

**Validates: Requirements 3.2, 4.2, 6.3, 6.5**

### Property 7: Secret Masking in Logs
*For any* secret value used in workflows, GitHub Actions should automatically mask the value in all log output.

**Validates: Requirements 5.5**

### Property 8: Build Artifact Consistency
*For any* successful build, the generated dist/ directory should contain all necessary files for production deployment (index.js, public assets, etc.).

**Validates: Requirements 6.6**

### Property 9: Deployment Status Notification
*For any* deployment attempt (success or failure), the notify job should execute and provide clear status information.

**Validates: Requirements 7.1, 7.2, 7.3, 7.5**

### Property 10: Health Check Validation
*For any* production deployment, the application should respond successfully to health check requests at /api/health within the configured timeout period.

**Validates: Requirements 4.5, 4.6, 8.4, 8.5**

## Error Handling

### Migration Errors

**Error**: Column does not exist when adding COMMENT
**Solution**: Add column first, then add comment
**Recovery**: Migration runner stops, logs error, releases advisory lock

**Error**: Table already exists
**Solution**: Use CREATE TABLE IF NOT EXISTS
**Recovery**: Migration continues (idempotent)

### Deployment Errors

**Error**: RAILWAY_TOKEN not set
**Solution**: Verify secret is configured in GitHub repository settings
**Recovery**: Workflow fails with clear error message

**Error**: Railway CLI authentication fails
**Solution**: Check token validity, regenerate if expired
**Recovery**: Workflow fails, manual intervention required

**Error**: Service not found
**Solution**: Verify service ID/name is correct
**Recovery**: Workflow fails with service identification error

**Error**: Build fails
**Solution**: Check build logs, fix TypeScript/build errors
**Recovery**: Workflow stops at build step, deployment prevented

**Error**: Health check timeout
**Solution**: Check application logs, verify /api/health endpoint
**Recovery**: Deployment marked as failed, previous version remains active

### CI/CD Errors

**Error**: Tests fail
**Solution**: Fix failing tests before merging
**Recovery**: Workflow stops, deployment prevented (unless force_deploy=true)

**Error**: Type check fails
**Solution**: Fix TypeScript errors
**Recovery**: Workflow stops at check step

**Error**: PostgreSQL service unavailable
**Solution**: GitHub Actions will retry, check service configuration
**Recovery**: Workflow fails if service doesn't start

## Testing Strategy

### Unit Tests
- Test migration SQL syntax validation
- Test Railway CLI command construction
- Test workflow YAML syntax
- Test secret injection mechanisms

### Integration Tests
- Test full workflow execution in GitHub Actions
- Test Railway deployment with test service
- Test database migration execution
- Test health check endpoint responses

### Property-Based Tests

**Test Framework**: GitHub Actions workflow testing + Railway CLI testing

**Configuration**: Each property test should run with multiple scenarios (fresh DB, partially migrated DB, different service configurations)

#### Property Test 1: Migration Idempotency Test
```yaml
# Feature: railway-cicd-fix, Property 1: Migration Idempotency
# Test that migration can run multiple times without errors
test:
  - name: Run migration on fresh database
    run: npm run migrate
  - name: Run migration again (should be idempotent)
    run: npm run migrate
  - name: Verify schema is correct
    run: node verify-schema.js
```

#### Property Test 2: Railway CLI Deployment Test
```yaml
# Feature: railway-cicd-fix, Property 3: Railway CLI Authentication Success
# Test that Railway CLI can authenticate and deploy
test:
  - name: Authenticate with Railway
    run: echo "$RAILWAY_TOKEN" | railway login --browserless
  - name: Verify authentication
    run: railway whoami
  - name: Deploy to test service
    run: railway up --service test-service --detach
```

#### Property Test 3: Workflow Trigger Test
```yaml
# Feature: railway-cicd-fix, Property 5: Workflow Trigger Correctness
# Test that workflows trigger on correct branches
test:
  - name: Push to dev branch
    run: git push origin dev
  - name: Verify staging workflow triggered
    run: gh run list --workflow=staging-deploy.yml --limit=1
  - name: Push to main branch
    run: git push origin main
  - name: Verify production workflow triggered
    run: gh run list --workflow=production-deploy.yml --limit=1
```

### Manual Testing Checklist
- [ ] Push to dev branch triggers staging deployment
- [ ] Push to main branch triggers production deployment
- [ ] Failed tests prevent deployment
- [ ] force_deploy bypasses test failures
- [ ] Secrets are masked in logs
- [ ] Railway dashboard shows successful deployment
- [ ] Health check endpoint responds correctly
- [ ] Application starts without migration errors
- [ ] Database schema matches expected state
- [ ] All environment variables are set correctly

## Implementation Notes

### Railway CLI Best Practices
1. Always use browserless login in CI environments
2. Use --detach flag for non-blocking deployments
3. Verify authentication with `railway whoami` before deploying
4. Use service ID for production (more stable than service name)
5. Check Railway CLI version compatibility

### GitHub Actions Best Practices
1. Use official Railway CLI Docker image
2. Cache npm dependencies for faster builds
3. Run tests in parallel when possible
4. Use matrix strategy for multi-environment testing
5. Set appropriate timeouts for long-running jobs

### Migration Best Practices
1. Always use IF NOT EXISTS/IF EXISTS clauses
2. Add columns before adding comments
3. Test migrations on fresh and partially migrated databases
4. Use transactions where appropriate
5. Provide clear error messages in migration failures

## Deployment Checklist

### Pre-Deployment
- [ ] Verify all GitHub secrets are configured
- [ ] Test migrations locally
- [ ] Run full test suite
- [ ] Review Railway service configuration
- [ ] Check Railway project token validity

### Deployment
- [ ] Push to dev branch for staging deployment
- [ ] Monitor GitHub Actions workflow
- [ ] Check Railway deployment logs
- [ ] Verify staging application health
- [ ] Test staging application functionality
- [ ] Merge to main for production deployment
- [ ] Monitor production deployment
- [ ] Verify production health checks

### Post-Deployment
- [ ] Verify database migrations completed
- [ ] Check application logs for errors
- [ ] Test critical user flows
- [ ] Monitor error rates
- [ ] Verify environment variables
- [ ] Document any issues encountered
