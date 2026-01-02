# DEPLOYMENT_RUNBOOK.md

## Production Deployment Guide for CreatorNexus

### Executive Summary

This runbook provides comprehensive instructions for deploying CreatorNexus to production environments. It covers infrastructure setup, security configuration, monitoring, and operational procedures.

---

## 1. INFRASTRUCTURE REQUIREMENTS

### 1.1 Minimum Production Requirements

- **Compute**: 2 vCPU, 8GB RAM (minimum), 4 vCPU, 16GB RAM (recommended)
- **Storage**: 100GB SSD for application and database
- **Network**: 100Mbps bandwidth minimum
- **Database**: PostgreSQL 15+ with connection pooling
- **Cache**: Redis 7+ for session and data caching
- **Load Balancer**: Nginx or AWS ALB for SSL termination

### 1.2 Supported Platforms

- **Cloud Providers**: AWS, Google Cloud, Azure, DigitalOcean
- **Container Orchestration**: Docker, Kubernetes
- **Infrastructure as Code**: Terraform, CloudFormation, Ansible

---

## 2. ENVIRONMENT CONFIGURATION

### 2.1 Production Environment Variables

```bash
# Application Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://user:password@db-host:5432/creaternexus_prod
DB_SSL=true
DB_POOL_MIN=2
DB_POOL_MAX=20

# Security Configuration
JWT_SECRET=<strong-random-secret-64-chars>
JWT_REFRESH_SECRET=<different-strong-random-secret>
BCRYPT_ROUNDS=12

# Session & Cookies
SESSION_SECRET=<strong-session-secret>
COOKIE_DOMAIN=.creaternexus.com
SECURE_COOKIES=true

# CORS Configuration
ALLOWED_ORIGINS=https://creaternexus.com,https://app.creaternexus.com
CORS_CREDENTIALS=true

# File Upload Configuration
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
MAX_FILE_SIZE=104857600  # 100MB

# AI Services
GOOGLE_GEMINI_API_KEY=<production-gemini-key>
OPENAI_API_KEY=<production-openai-key>

# Email Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
FROM_EMAIL=noreply@creaternexus.com

# Monitoring & Logging
SENTRY_DSN=<sentry-dsn>
LOG_LEVEL=info
PROMETHEUS_METRICS=true

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_CONNECTIONS=10000

# Redis Configuration
REDIS_URL=redis://redis-host:6379
REDIS_PASSWORD=<redis-password>
REDIS_SSL=true
```

### 2.2 Environment Validation

```bash
#!/bin/bash
# validate-env.sh

REQUIRED_VARS=(
  "DATABASE_URL"
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "CLOUDINARY_CLOUD_NAME"
  "GOOGLE_GEMINI_API_KEY"
  "OPENAI_API_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "ERROR: Required environment variable $var is not set"
    exit 1
  fi
done

echo "✅ All required environment variables are set"
```

---

## 3. DATABASE SETUP

### 3.1 Production Database Configuration

```sql
-- Production database setup
CREATE DATABASE creatornexus_prod
    WITH OWNER = creatornexus_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Create user with limited privileges
CREATE USER creatornexus_user WITH PASSWORD 'strong-password';
GRANT CONNECT ON DATABASE creatornexus_prod TO creatornexus_user;
GRANT USAGE ON SCHEMA public TO creatornexus_user;

-- Grant specific permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO creatornexus_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO creatornexus_user;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
```

### 3.2 Database Backup Strategy

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/opt/creaternexus/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/creaternexus_prod_$DATE.sql"

# Create backup
pg_dump -U creatornexus_user -h localhost creatornexus_prod > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

# Upload to cloud storage (example with AWS S3)
aws s3 cp "${BACKUP_FILE}.gz" s3://creaternexus-backups/database/

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "✅ Database backup completed: ${BACKUP_FILE}.gz"
```

---

## 4. APPLICATION DEPLOYMENT

### 4.1 Docker Production Setup

#### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    su-exec \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001

# Copy package files
COPY --chown=appuser:nodejs package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY --chown=appuser:nodejs . .

# Build application
RUN npm run build

# Switch to non-root user
USER appuser

EXPOSE 5000

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

#### Docker Compose (Production)
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: creatornexus-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://creaternexus_user:password@db:5432/creaternexus_prod
      - REDIS_URL=redis://redis:6379
    ports:
      - "127.0.0.1:5000:5000"
    depends_on:
      - db
      - redis
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs
    networks:
      - creatornexus
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  db:
    image: postgres:15-alpine
    container_name: creatornexus-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=creaternexus_prod
      - POSTGRES_USER=creaternexus_user
      - POSTGRES_PASSWORD=<strong-password>
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "127.0.0.1:5432:5432"
    networks:
      - creatornexus
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U creatornexus_user -d creatornexus_prod"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: creatornexus-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass <redis-password>
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    networks:
      - creatornexus
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
  uploads:
  logs:

networks:
  creatornexus:
    driver: bridge
```

### 4.2 Nginx Configuration

```nginx
# /etc/nginx/sites-available/creaternexus
upstream creatornexus_app {
    server 127.0.0.1:5000;
    keepalive 32;
}

server {
    listen 80;
    server_name creatornexus.com www.creaternexus.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name creatornexus.com www.creaternexus.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/creaternexus.crt;
    ssl_certificate_key /etc/ssl/private/creaternexus.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' wss: https://api.openai.com https://generativelanguage.googleapis.com";

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Static files
    location /static/ {
        alias /var/www/creaternexus/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API endpoints
    location /api/ {
        proxy_pass http://creaternexus_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Rate limiting for API
        limit_req zone=api burst=20 nodelay;

        # Timeout settings
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://creaternexus_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket specific settings
        proxy_buffering off;
        proxy_cache off;
    }

    # Main application
    location / {
        proxy_pass http://creaternexus_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Security headers for HTML
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header Referrer-Policy "strict-origin-when-cross-origin";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ \.(env|log)$ {
        deny all;
    }
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;
```

---

## 5. MONITORING & OBSERVABILITY

### 5.1 Prometheus Metrics

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'creaternexus-app'
    static_configs:
      - targets: ['localhost:5000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['localhost:9121']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']
```

### 5.2 Grafana Dashboards

Key metrics to monitor:
- Application response time
- Error rate (4xx/5xx)
- Database connection pool usage
- Redis memory usage
- WebSocket connections
- File upload success rate
- AI service response times

### 5.3 Alerting Rules

```yaml
# alert_rules.yml
groups:
  - name: creatornexus
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High database connection count"
          description: "Database has {{ $value }} active connections"

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Redis memory usage high"
          description: "Redis memory usage is {{ $value }}%"
```

---

## 6. SECURITY CONFIGURATION

### 6.1 SSL/TLS Setup

```bash
#!/bin/bash
# setup-ssl.sh

# Install certbot for Let's Encrypt
apt update
apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d creatornexus.com -d www.creaternexus.com

# Set up auto-renewal
crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | crontab -
```

### 6.2 Security Headers

```typescript
// server/middleware/security.ts
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "wss:", "https://api.openai.com", "https://generativelanguage.googleapis.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});
```

### 6.3 Rate Limiting

```typescript
// server/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Redis store for distributed rate limiting
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
  });
};

// Different limits for different endpoints
export const apiLimiter = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const authLimiter = createRateLimit(15 * 60 * 1000, 5);  // 5 auth attempts per 15 minutes
export const uploadLimiter = createRateLimit(60 * 60 * 1000, 10); // 10 uploads per hour
```

---

## 7. BACKUP & RECOVERY

### 7.1 Automated Backup Strategy

```bash
#!/bin/bash
# automated-backup.sh

# Database backup
BACKUP_DIR="/opt/creaternexus/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create database backup
pg_dump -U creatornexus_user -h localhost -Fc creatornexus_prod > "$BACKUP_DIR/db_$TIMESTAMP.dump"

# Backup uploaded files
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" /opt/creaternexus/uploads/

# Backup application data
tar -czf "$BACKUP_DIR/app_$TIMESTAMP.tar.gz" \
  --exclude='node_modules' \
  --exclude='logs' \
  /opt/creaternexus/app/

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR/" s3://creaternexus-backups/ --recursive --exclude "*" --include "*.dump" --include "*.tar.gz"

# Clean up local backups older than 7 days
find "$BACKUP_DIR" -name "*.dump" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

# Send notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Daily backup completed successfully"}' \
  $SLACK_WEBHOOK_URL
```

### 7.2 Disaster Recovery

```bash
#!/bin/bash
# disaster-recovery.sh

# Stop application
docker-compose down

# Restore database
pg_restore -U creatornexus_user -h localhost -d creatornexus_prod \
  --clean --if-exists --create \
  /opt/creaternexus/backups/db_latest.dump

# Restore uploaded files
tar -xzf /opt/creaternexus/backups/uploads_latest.tar.gz -C /

# Restore application code
tar -xzf /opt/creaternexus/backups/app_latest.tar.gz -C /opt/creaternexus/

# Restart application
docker-compose up -d

# Run health checks
curl -f http://localhost:5000/api/health
```

---

## 8. PERFORMANCE OPTIMIZATION

### 8.1 Database Optimization

```sql
-- Performance optimization queries

-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_content_user_created ON content(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_content_status ON content(status);
CREATE INDEX CONCURRENTLY idx_projects_user_id ON projects(user_id);
CREATE INDEX CONCURRENTLY idx_ai_tasks_status ON ai_generation_tasks(status, created_at);

-- Optimize table statistics
ANALYZE content;
ANALYZE projects;
ANALYZE users;

-- Set up partitioning for large tables (if needed)
-- CREATE TABLE content_y2024m01 PARTITION OF content
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### 8.2 Application Performance

```typescript
// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent')
      });
    }

    // Record metrics
    responseTimeHistogram.observe(duration);
  });

  next();
};
```

---

## 9. DEPLOYMENT CHECKLIST

### Pre-deployment
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Database backup created
- [ ] Code tested in staging
- [ ] Security scan completed
- [ ] Performance benchmarks met

### Deployment Steps
- [ ] Create deployment branch
- [ ] Run build process
- [ ] Update containers/images
- [ ] Run database migrations
- [ ] Deploy application
- [ ] Update load balancer
- [ ] Run health checks
- [ ] Monitor error rates

### Post-deployment
- [ ] Verify application functionality
- [ ] Check monitoring dashboards
- [ ] Run smoke tests
- [ ] Update documentation
- [ ] Notify stakeholders

---

## 10. MAINTENANCE PROCEDURES

### 10.1 Regular Maintenance Tasks

```bash
#!/bin/bash
# maintenance.sh

# Update dependencies
npm audit fix
npm update

# Clean up old logs
find /opt/creaternexus/logs -name "*.log" -mtime +30 -delete

# Vacuum database
psql -U creatornexus_user -d creatornexus_prod -c "VACUUM ANALYZE;"

# Update SSL certificates
certbot renew

# Restart services
docker-compose restart

# Send maintenance report
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Weekly maintenance completed"}' \
  $SLACK_WEBHOOK_URL
```

### 10.2 Emergency Procedures

```bash
#!/bin/bash
# emergency-rollback.sh

# Quick rollback to previous version
docker tag creatornexus/app:latest creatornexus/app:failed-$(date +%Y%m%d_%H%M%S)
docker tag creatornexus/app:previous creatornexus/app:latest

# Restart with previous version
docker-compose down
docker-compose up -d

# Send alert
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"🚨 Emergency rollback performed"}' \
  $SLACK_WEBHOOK_URL
```

---

## 11. COMPLIANCE & AUDIT

### 11.1 Security Compliance

- Regular security scans with tools like OWASP ZAP
- Dependency vulnerability scanning
- Container image scanning with Trivy
- Database security audits
- Access log monitoring

### 11.2 Data Compliance

- GDPR compliance for EU users
- Data retention policies
- Right to erasure implementation
- Data export functionality
- Audit logging for sensitive operations

---

## 12. SUPPORT & CONTACTS

### Emergency Contacts
- **DevOps Lead**: devops@creaternexus.com
- **Security Team**: security@creaternexus.com
- **Database Admin**: dba@creaternexus.com

### Monitoring
- **Status Page**: https://status.creaternexus.com
- **Logs**: ELK Stack at https://logs.creaternexus.com
- **Metrics**: Grafana at https://metrics.creaternexus.com

### Documentation
- **Runbook Updates**: https://docs.creaternexus.com/deployment
- **Incident Response**: https://docs.creaternexus.com/incidents
- **Change Management**: https://docs.creaternexus.com/changes

---

*This deployment runbook ensures reliable, secure, and maintainable production deployments of CreatorNexus. Regular updates and testing are crucial for maintaining system reliability.*
