# SECRETS_AND_ENVIRONMENTS.md

## Secrets Management and Environment Configuration Guide

### Executive Summary

This guide covers the comprehensive management of secrets, environment variables, and configuration for CreatorNexus across all deployment environments. It ensures security, consistency, and operational efficiency.

---

## 1. ENVIRONMENT OVERVIEW

### 1.1 Environment Types

| Environment | Purpose | Security Level | Data Persistence |
|-------------|---------|----------------|------------------|
| `development` | Local development | Low | Local database |
| `staging` | Pre-production testing | Medium | Staging database |
| `production` | Live application | High | Production database |
| `testing` | Automated testing | Low | Test database |

### 1.2 Environment Files Structure

```
.env.development    # Development environment
.env.staging        # Staging environment
.env.production     # Production environment
.env.testing        # Testing environment
.env.example        # Template for new environments
```

---

## 2. SECRET MANAGEMENT

### 2.1 Secret Categories

#### Critical Secrets (Never in Code)
- JWT signing secrets
- Database passwords
- API keys for external services
- SSL/TLS certificates
- Encryption keys

#### Configuration Values
- Database connection strings
- External service endpoints
- Feature flags
- Rate limiting settings

### 2.2 Secret Storage Solutions

#### Local Development
```bash
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/creaternexus_dev
JWT_SECRET=dev-jwt-secret-change-in-production
```

#### Production (Recommended Solutions)

**AWS Secrets Manager:**
```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

export async function getSecret(secretName: string): Promise<string> {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
        VersionStage: "AWSCURRENT",
      })
    );
    return response.SecretString!;
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }
}
```

**HashiCorp Vault:**
```typescript
import Vault from 'node-vault';

const vault = Vault({
  endpoint: process.env.VAULT_ENDPOINT,
  token: process.env.VAULT_TOKEN
});

export async function getVaultSecret(path: string): Promise<any> {
  const result = await vault.read(path);
  return result.data;
}
```

**Azure Key Vault:**
```typescript
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

const credential = new DefaultAzureCredential();
const client = new SecretClient(process.env.KEY_VAULT_URL!, credential);

export async function getAzureSecret(secretName: string): Promise<string> {
  const secret = await client.getSecret(secretName);
  return secret.value!;
}
```

---

## 3. ENVIRONMENT VARIABLES REFERENCE

### 3.1 Application Configuration

```bash
# Core Application
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
LOG_LEVEL=info
API_VERSION=v1

# Security
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-different-string>
BCRYPT_ROUNDS=12
SESSION_SECRET=<32-char-random-string>

# CORS
ALLOWED_ORIGINS=https://creaternexus.com,https://app.creaternexus.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# Cookies
COOKIE_DOMAIN=.creaternexus.com
SECURE_COOKIES=true
HTTP_ONLY_COOKIES=true
```

### 3.2 Database Configuration

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_CONNECTION_TIMEOUT=30000
DB_IDLE_TIMEOUT=600000
DB_ACQUIRE_TIMEOUT=60000

# Redis (Optional)
REDIS_URL=redis://user:password@host:6379
REDIS_SSL=true
REDIS_MAX_CONNECTIONS=20
REDIS_RETRY_DELAY=1000
```

### 3.3 External Services

```bash
# AI Services
GOOGLE_GEMINI_API_KEY=<gemini-api-key>
OPENAI_API_KEY=<openai-api-key>
ANTHROPIC_API_KEY=<anthropic-api-key>

# Cloud Storage
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
AWS_S3_BUCKET=<s3-bucket-name>
AWS_ACCESS_KEY_ID=<aws-access-key>
AWS_SECRET_ACCESS_KEY=<aws-secret-key>

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
FROM_EMAIL=noreply@creaternexus.com

# Social Media APIs
YOUTUBE_CLIENT_ID=<youtube-client-id>
YOUTUBE_CLIENT_SECRET=<youtube-client-secret>
LINKEDIN_CLIENT_ID=<linkedin-client-id>
LINKEDIN_CLIENT_SECRET=<linkedin-client-secret>
```

### 3.4 Monitoring & Observability

```bash
# Sentry (Error Tracking)
SENTRY_DSN=<sentry-dsn>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Prometheus Metrics
PROMETHEUS_METRICS=true
METRICS_PORT=9090

# Logging
LOG_FORMAT=json
LOG_FILE_PATH=/var/log/creaternexus/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5

# Health Checks
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
```

### 3.5 Feature Flags

```bash
# Feature Toggles
FEATURE_AI_VIDEO_GENERATION=true
FEATURE_COLLABORATION=true
FEATURE_ADVANCED_ANALYTICS=false
FEATURE_SOCIAL_MEDIA_INTEGRATION=true
FEATURE_BULK_OPERATIONS=true

# Beta Features
BETA_AI_INSIGHTS=true
BETA_AUTOMATED_SCHEDULING=false
```

---

## 4. ENVIRONMENT SETUP SCRIPTS

### 4.1 Development Environment Setup

```bash
#!/bin/bash
# setup-dev-env.sh

# Copy environment template
cp .env.example .env.development

# Generate secure secrets for development
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 16)

# Update environment file
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.development
sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env.development
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$SESSION_SECRET/" .env.development

echo "✅ Development environment configured"
```

### 4.2 Production Environment Validation

```bash
#!/bin/bash
# validate-prod-env.sh

REQUIRED_SECRETS=(
  "DATABASE_URL"
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "GOOGLE_GEMINI_API_KEY"
  "OPENAI_API_KEY"
  "CLOUDINARY_CLOUD_NAME"
  "CLOUDINARY_API_KEY"
  "CLOUDINARY_API_SECRET"
  "SMTP_PASS"
  "SENTRY_DSN"
)

echo "🔍 Validating production environment..."

for secret in "${REQUIRED_SECRETS[@]}"; do
  if [[ -z "${!secret}" ]]; then
    echo "❌ ERROR: Required secret $secret is not set"
    exit 1
  fi
done

# Validate secret strengths
if [[ ${#JWT_SECRET} -lt 64 ]]; then
  echo "❌ ERROR: JWT_SECRET must be at least 64 characters"
  exit 1
fi

if [[ ${#JWT_REFRESH_SECRET} -lt 64 ]]; then
  echo "❌ ERROR: JWT_REFRESH_SECRET must be at least 64 characters"
  exit 1
fi

echo "✅ All production secrets validated"
```

### 4.3 Secret Rotation Script

```bash
#!/bin/bash
# rotate-secrets.sh

echo "🔄 Rotating application secrets..."

# Generate new secrets
NEW_JWT_SECRET=$(openssl rand -hex 32)
NEW_JWT_REFRESH_SECRET=$(openssl rand -hex 32)
NEW_SESSION_SECRET=$(openssl rand -hex 16)

# Update AWS Secrets Manager
aws secretsmanager update-secret \
  --secret-id creatornexus/jwt-secret \
  --secret-string "$NEW_JWT_SECRET"

aws secretsmanager update-secret \
  --secret-id creatornexus/jwt-refresh-secret \
  --secret-string "$NEW_JWT_REFRESH_SECRET"

# Update application
kubectl set env deployment/creaternexus-app \
  JWT_SECRET="$NEW_JWT_SECRET" \
  JWT_REFRESH_SECRET="$NEW_JWT_REFRESH_SECRET" \
  SESSION_SECRET="$NEW_SESSION_SECRET"

# Restart application
kubectl rollout restart deployment/creaternexus-app

echo "✅ Secrets rotated successfully"
```

---

## 5. CONFIGURATION MANAGEMENT

### 5.1 Configuration Classes

```typescript
// server/config/index.ts
import { z } from 'zod';

// Environment schema validation
const configSchema = z.object({
  nodeEnv: z.enum(['development', 'staging', 'production', 'testing']),
  port: z.number().min(1000).max(9999),
  database: z.object({
    url: z.string().url(),
    ssl: z.boolean(),
    poolMin: z.number().min(1),
    poolMax: z.number().min(5),
  }),
  jwt: z.object({
    secret: z.string().min(64),
    refreshSecret: z.string().min(64),
    expiresIn: z.string(),
    refreshExpiresIn: z.string(),
  }),
  security: z.object({
    bcryptRounds: z.number().min(8).max(15),
    rateLimitWindow: z.number(),
    rateLimitMax: z.number(),
  }),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  return configSchema.parse({
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000'),
    database: {
      url: process.env.DATABASE_URL!,
      ssl: process.env.DB_SSL === 'true',
      poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
      poolMax: parseInt(process.env.DB_POOL_MAX || '20'),
    },
    jwt: {
      secret: process.env.JWT_SECRET!,
      refreshSecret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '15'),
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    },
  });
}
```

### 5.2 Runtime Configuration

```typescript
// server/config/runtime.ts
import { loadConfig } from './index';

let config: Config | null = null;

export function getConfig(): Config {
  if (!config) {
    config = loadConfig();
  }
  return config;
}

export function reloadConfig(): void {
  config = loadConfig();
}

// Hot reload configuration in development
if (process.env.NODE_ENV === 'development') {
  process.on('SIGHUP', () => {
    console.log('🔄 Reloading configuration...');
    reloadConfig();
  });
}
```

---

## 6. SECURITY BEST PRACTICES

### 6.1 Secret Handling

```typescript
// server/utils/secrets.ts
import crypto from 'crypto';

export class SecretManager {
  private static instance: SecretManager;
  private secrets: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): SecretManager {
    if (!SecretManager.instance) {
      SecretManager.instance = new SecretManager();
    }
    return SecretManager.instance;
  }

  async getSecret(key: string): Promise<string> {
    if (this.secrets.has(key)) {
      return this.secrets.get(key)!;
    }

    // Load from secure storage based on environment
    const secret = await this.loadFromSecureStorage(key);
    this.secrets.set(key, secret);
    return secret;
  }

  private async loadFromSecureStorage(key: string): Promise<string> {
    switch (process.env.SECRET_STORE) {
      case 'aws':
        return this.loadFromAWS(key);
      case 'vault':
        return this.loadFromVault(key);
      case 'azure':
        return this.loadFromAzure(key);
      default:
        return process.env[key] || '';
    }
  }

  private async loadFromAWS(key: string): Promise<string> {
    const { SecretsManagerClient, GetSecretValueCommand } = await import('@aws-sdk/client-secrets-manager');
    const client = new SecretsManagerClient({ region: process.env.AWS_REGION });
    const command = new GetSecretValueCommand({ SecretId: key });
    const response = await client.send(command);
    return response.SecretString!;
  }

  // Implement other providers...
}
```

### 6.2 Environment Variable Validation

```typescript
// server/middleware/envValidation.ts
import { Request, Response, NextFunction } from 'express';

export function validateEnvironment(req: Request, res: Response, next: NextFunction) {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'GOOGLE_GEMINI_API_KEY',
    'OPENAI_API_KEY'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Application is not properly configured'
    });
  }

  next();
}
```

---

## 7. ENVIRONMENT SPECIFIC CONFIGURATIONS

### 7.1 Development Configuration

```typescript
// config/development.ts
export const developmentConfig = {
  logging: {
    level: 'debug',
    format: 'dev'
  },
  database: {
    debug: true,
    slowQueryThreshold: 1000
  },
  security: {
    corsOrigins: ['http://localhost:3000', 'http://localhost:5000'],
    helmet: false
  },
  features: {
    debugMode: true,
    mockExternalAPIs: true
  }
};
```

### 7.2 Production Configuration

```typescript
// config/production.ts
export const productionConfig = {
  logging: {
    level: 'info',
    format: 'json'
  },
  database: {
    debug: false,
    slowQueryThreshold: 5000
  },
  security: {
    corsOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    helmet: true
  },
  features: {
    debugMode: false,
    mockExternalAPIs: false
  },
  monitoring: {
    sentry: true,
    prometheus: true,
    healthChecks: true
  }
};
```

---

## 8. MONITORING & ALERTING

### 8.1 Secret Expiration Monitoring

```typescript
// server/services/secretMonitor.ts
export class SecretMonitor {
  private static readonly SECRET_ROTATION_DAYS = 90;

  async checkSecretExpiration(): Promise<void> {
    const secrets = await this.getAllSecrets();

    for (const secret of secrets) {
      const daysSinceCreation = this.getDaysSinceCreation(secret.createdAt);

      if (daysSinceCreation > this.SECRET_ROTATION_DAYS) {
        await this.alertSecretExpiration(secret.name, daysSinceCreation);
      }
    }
  }

  private async alertSecretExpiration(secretName: string, daysOld: number): Promise<void> {
    console.warn(`⚠️  Secret ${secretName} is ${daysOld} days old and should be rotated`);

    // Send alert to monitoring system
    // await monitoring.alert('SecretExpirationWarning', {
    //   secret: secretName,
    //   daysOld,
    //   severity: 'high'
    // });
  }
}
```

### 8.2 Configuration Drift Detection

```typescript
// server/services/configMonitor.ts
export class ConfigMonitor {
  private lastConfigHash: string = '';

  async detectConfigDrift(): Promise<void> {
    const currentConfig = JSON.stringify(process.env);
    const currentHash = crypto.createHash('sha256').update(currentConfig).digest('hex');

    if (this.lastConfigHash && this.lastConfigHash !== currentHash) {
      console.warn('⚠️  Configuration drift detected!');
      await this.alertConfigDrift();
    }

    this.lastConfigHash = currentHash;
  }

  private async alertConfigDrift(): Promise<void> {
    // Alert administrators about configuration changes
    console.error('🚨 Configuration has changed unexpectedly');
  }
}
```

---

## 9. COMPLIANCE & AUDIT

### 9.1 Secret Access Logging

```typescript
// server/middleware/secretAccessLogger.ts
export function logSecretAccess(req: Request, res: Response, next: NextFunction) {
  if (req.path.includes('/secrets') || req.path.includes('/config')) {
    console.log(`🔐 Secret access: ${req.method} ${req.path} by ${req.user?.id || 'anonymous'}`);
  }
  next();
}
```

### 9.2 Environment Compliance Checks

```bash
#!/bin/bash
# compliance-check.sh

echo "🔍 Running compliance checks..."

# Check for hardcoded secrets
if grep -r "password\|secret\|key" --include="*.ts" --include="*.js" src/ | grep -v "process.env\|config."; then
  echo "❌ Found potential hardcoded secrets"
  exit 1
fi

# Check environment variable exposure
if grep -r "console.log.*process.env" src/; then
  echo "❌ Found environment variables in logs"
  exit 1
fi

# Check for insecure configurations
if [[ "$NODE_ENV" == "production" ]] && [[ "$DEBUG" == "true" ]]; then
  echo "❌ DEBUG mode enabled in production"
  exit 1
fi

echo "✅ Compliance checks passed"
```

---

## 10. DISASTER RECOVERY

### 10.1 Secret Backup and Recovery

```bash
#!/bin/bash
# backup-secrets.sh

BACKUP_DIR="/opt/creaternexus/secret-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup AWS Secrets Manager
aws secretsmanager list-secrets --query 'SecretList[*].Name' | \
  jq -r '.[]' | \
  while read secret; do
    aws secretsmanager get-secret-value --secret-id "$secret" > "$BACKUP_DIR/$secret.json"
  done

# Encrypt backup
tar -czf "$BACKUP_DIR/secrets_$TIMESTAMP.tar.gz" "$BACKUP_DIR"/*.json
openssl enc -aes-256-cbc -salt -in "$BACKUP_DIR/secrets_$TIMESTAMP.tar.gz" \
  -out "$BACKUP_DIR/secrets_$TIMESTAMP.enc" -k "$ENCRYPTION_KEY"

# Upload to secure location
aws s3 cp "$BACKUP_DIR/secrets_$TIMESTAMP.enc" s3://creaternexus-secret-backups/

echo "✅ Secrets backed up successfully"
```

---

## 11. DEVELOPMENT WORKFLOW

### 11.1 Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd creatornexus

# Set up environment
cp .env.example .env.development
# Edit .env.development with your local settings

# Install dependencies
npm install

# Start development server
npm run dev
```

### 11.2 CI/CD Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  validate-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Validate Secrets
        run: ./scripts/validate-prod-env.sh
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}

  deploy:
    needs: validate-secrets
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Production
        run: ./scripts/deploy.sh
```

---

*This comprehensive secrets and environment management guide ensures secure, consistent, and maintainable configuration across all CreatorNexus environments. Regular audits and updates are essential for maintaining security standards.*
