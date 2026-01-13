# Requirements Document: Railway CI/CD Deployment Fix

## Introduction

This specification addresses the critical database migration failure preventing Railway deployments and establishes a proper CI/CD pipeline for automated deployments to Railway's staging and production environments using GitHub Actions.

## Glossary

- **Railway**: Cloud deployment platform for hosting the application
- **CI/CD**: Continuous Integration/Continuous Deployment automation pipeline
- **Migration_Runner**: System component that executes database schema migrations
- **GitHub_Actions**: Automated workflow system for CI/CD
- **Service_ID**: Unique identifier for a Railway service
- **Project_Token**: Authentication token for Railway CLI access
- **Nixpacks**: Railway's build system for containerizing applications

## Requirements

### Requirement 1: Fix Database Migration Failure

**User Story:** As a DevOps engineer, I want database migrations to execute successfully, so that the application can start without errors.

#### Acceptance Criteria

1. WHEN migration 0003_additional_tables_safe.sql executes, THE Migration_Runner SHALL NOT reference non-existent columns in COMMENT statements
2. WHEN adding comments to columns, THE Migration_Runner SHALL only reference columns that exist in the target table
3. WHEN the content table is modified, THE Migration_Runner SHALL add the is_paused, is_stopped, can_publish, publish_order, content_version, and last_regenerated_at columns before adding comments
4. WHEN all migrations complete successfully, THE Application SHALL start and connect to the database
5. IF a migration fails, THEN THE Migration_Runner SHALL provide clear error messages indicating which SQL statement failed

### Requirement 2: Implement Railway CLI Deployment

**User Story:** As a DevOps engineer, I want to deploy to Railway using the official CLI method, so that deployments are reliable and follow Railway's best practices.

#### Acceptance Criteria

1. WHEN GitHub Actions workflow triggers, THE Deployment_System SHALL use the official Railway CLI Docker image (ghcr.io/railwayapp/cli:latest)
2. WHEN authenticating with Railway, THE Deployment_System SHALL use the RAILWAY_TOKEN environment variable
3. WHEN deploying to a service, THE Deployment_System SHALL use the `railway up --service=<service_id>` command
4. WHEN the deployment command executes, THE Deployment_System SHALL run in detached mode (--detach flag)
5. WHEN deployment completes, THE Deployment_System SHALL exit with appropriate status codes (0 for success, non-zero for failure)

### Requirement 3: Configure Staging Environment Deployment

**User Story:** As a developer, I want automatic deployments to staging when I push to the dev branch, so that I can test changes in a production-like environment.

#### Acceptance Criteria

1. WHEN code is pushed to the dev branch, THE GitHub_Actions SHALL trigger the staging deployment workflow
2. WHEN the staging workflow runs, THE GitHub_Actions SHALL execute tests before deployment
3. WHEN tests pass, THE GitHub_Actions SHALL build the application
4. WHEN the build succeeds, THE GitHub_Actions SHALL deploy to the Railway staging service
5. WHEN deployment fails, THE GitHub_Actions SHALL notify with clear error messages
6. WHERE force_deploy input is true, THE GitHub_Actions SHALL deploy even if tests fail

### Requirement 4: Configure Production Environment Deployment

**User Story:** As a DevOps engineer, I want automatic deployments to production when I push to the main branch, so that approved changes go live automatically.

#### Acceptance Criteria

1. WHEN code is pushed to the main branch, THE GitHub_Actions SHALL trigger the production deployment workflow
2. WHEN the production workflow runs, THE GitHub_Actions SHALL execute all tests and security checks
3. WHEN all checks pass, THE GitHub_Actions SHALL build the application
4. WHEN the build succeeds, THE GitHub_Actions SHALL deploy to the Railway production service
5. WHEN deployment completes, THE GitHub_Actions SHALL wait for health checks to pass
6. WHEN health checks fail, THE GitHub_Actions SHALL report the failure and exit with error code

### Requirement 5: Secure Secrets Management

**User Story:** As a security engineer, I want Railway tokens and service IDs stored securely, so that credentials are not exposed in code or logs.

#### Acceptance Criteria

1. THE GitHub_Repository SHALL store RAILWAY_TOKEN as an encrypted secret
2. THE GitHub_Repository SHALL store RAILWAY_STAGING_SERVICE_NAME as an encrypted secret
3. THE GitHub_Repository SHALL store RAILWAY_PROD_SERVICE_ID as an encrypted secret
4. WHEN workflows execute, THE GitHub_Actions SHALL inject secrets as environment variables
5. WHEN logging output, THE GitHub_Actions SHALL mask all secret values automatically

### Requirement 6: Build and Test Pipeline

**User Story:** As a developer, I want automated testing before deployment, so that broken code doesn't reach production.

#### Acceptance Criteria

1. WHEN the workflow runs, THE GitHub_Actions SHALL install dependencies using npm ci
2. WHEN dependencies are installed, THE GitHub_Actions SHALL run TypeScript type checking (npm run check)
3. WHEN type checking passes, THE GitHub_Actions SHALL execute the test suite (npm test)
4. WHEN tests run, THE GitHub_Actions SHALL use a PostgreSQL service container for database tests
5. WHEN all tests pass, THE GitHub_Actions SHALL proceed to the build step
6. WHEN the build step runs, THE GitHub_Actions SHALL execute npm run build
7. IF any step fails, THEN THE GitHub_Actions SHALL stop the workflow and report the failure

### Requirement 7: Deployment Status Notifications

**User Story:** As a developer, I want clear notifications about deployment status, so that I know if my changes were deployed successfully.

#### Acceptance Criteria

1. WHEN deployment succeeds, THE GitHub_Actions SHALL log a success message with deployment details
2. WHEN deployment fails, THE GitHub_Actions SHALL log an error message with troubleshooting guidance
3. WHEN viewing workflow logs, THE Developer SHALL see clear step-by-step progress indicators
4. WHEN deployment completes, THE GitHub_Actions SHALL provide the Railway dashboard URL for verification
5. THE Notification_System SHALL always run regardless of deployment success or failure

### Requirement 8: Railway Configuration Files

**User Story:** As a DevOps engineer, I want proper Railway configuration files, so that the platform knows how to build and run the application.

#### Acceptance Criteria

1. THE Repository SHALL contain a railway.json file with deployment configuration
2. THE railway.json SHALL specify the Nixpacks builder
3. THE railway.json SHALL define the start command as "npm run start"
4. THE railway.json SHALL configure health check path as "/api/health"
5. THE railway.json SHALL set health check timeout to 300 seconds
6. THE railway.json SHALL configure restart policy as "ON_FAILURE" with max 5 retries
7. THE Repository SHALL contain a nixpacks.toml file with build configuration
8. THE nixpacks.toml SHALL specify Node.js 20 as the runtime

### Requirement 9: Migration Idempotency

**User Story:** As a database administrator, I want migrations to be idempotent, so that they can be safely re-run without causing errors.

#### Acceptance Criteria

1. WHEN adding columns, THE Migration SHALL use "ADD COLUMN IF NOT EXISTS" syntax
2. WHEN creating tables, THE Migration SHALL use "CREATE TABLE IF NOT EXISTS" syntax
3. WHEN creating indexes, THE Migration SHALL use "CREATE INDEX IF NOT EXISTS" syntax
4. WHEN dropping triggers, THE Migration SHALL use "DROP TRIGGER IF EXISTS" syntax
5. WHEN a migration runs multiple times, THE Database SHALL remain in a consistent state

### Requirement 10: CI/CD Environment Variables

**User Story:** As a DevOps engineer, I want proper environment variables configured, so that the application runs correctly in CI/CD environments.

#### Acceptance Criteria

1. WHEN tests run, THE GitHub_Actions SHALL set NODE_ENV to "test"
2. WHEN tests run, THE GitHub_Actions SHALL set SKIP_RATE_LIMIT to "1"
3. WHEN tests run, THE GitHub_Actions SHALL provide a DATABASE_URL for the PostgreSQL service
4. WHEN deploying, THE Railway SHALL use NODE_ENV set to "production"
5. WHEN the Railway CLI runs, THE System SHALL detect CI environment automatically (CI=true)
