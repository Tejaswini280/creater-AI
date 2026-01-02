# RUNNING_THE_APP.md

## Development Setup & Running Instructions

### **Executive Summary**

This guide provides comprehensive instructions for setting up, running, and developing the Renexus platform. It covers local development, testing, debugging, and deployment preparation.

---

## **1. PREREQUISITES**

### **1.1 System Requirements**

#### **Minimum Requirements**
- **Node.js**: Version 18.0 or higher
- **PostgreSQL**: Version 13 or higher
- **Git**: Version 2.25 or higher
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space for dependencies and database

#### **Recommended Development Environment**
- **Operating System**: macOS, Linux, or Windows 10/11 with WSL2
- **IDE**: VS Code with TypeScript and React extensions
- **Terminal**: Modern terminal with Git integration
- **Browser**: Chrome 90+ or Firefox 88+ for development

### **1.2 Required Software**

#### **Core Dependencies**
```bash
# Check Node.js version
node --version  # Should be 18.0+

# Check npm version
npm --version   # Should be 8.0+

# Check Git version
git --version   # Should be 2.25+
```

#### **Database Setup**
```bash
# Install PostgreSQL (Ubuntu/Debian)
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install PostgreSQL (macOS with Homebrew)
brew install postgresql
brew services start postgresql

# Install PostgreSQL (Windows)
# Download from https://www.postgresql.org/download/windows/
```

---

## **2. INITIAL SETUP**

### **2.1 Clone Repository**

```bash
# Clone the repository
git clone <repository-url>
cd renexus

# Verify the structure
ls -la
# Should see: client/, server/, shared/, docs/, package.json, etc.
```

### **2.2 Install Dependencies**

```bash
# Install root dependencies
npm install

# Verify installation
npm list --depth=0
```

### **2.3 Environment Configuration**

#### **Create Environment File**
```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file with your settings
nano .env
```

#### **Environment Variables**
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/renexus_dev

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret

# AI Service API Keys
GOOGLE_GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# OAuth Configuration (for social media integration)
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Application Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5000

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

---

## **3. DATABASE SETUP**

### **3.1 Create Database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE renexus_dev;
CREATE USER renexus_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE renexus_dev TO renexus_user;

# Exit PostgreSQL
\q
```

### **3.2 Run Migrations**

```bash
# Push database schema
npm run db:push

# Verify migration success
# Check that tables were created
psql -U renexus_user -d renexus_dev -c "\dt"
```

### **3.3 Seed Database (Optional)**

```bash
# Run database seeding scripts
npm run db:seed

# Or run specific seed files
node server/db-seed.js
```

---

## **4. DEVELOPMENT WORKFLOW**

### **4.1 Start Development Server**

```bash
# Start the development server
npm run dev

# This will start both frontend and backend
# Frontend: http://localhost:5000
# Backend API: http://localhost:5000/api
```

### **4.2 Development URLs**

- **Main Application**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api/docs
- **WebSocket Connection**: ws://localhost:5000/ws
- **Health Check**: http://localhost:5000/api/health

### **4.3 Development Commands**

```bash
# Start development server
npm run dev

# Start only backend (for API development)
npm run dev:server

# Start only frontend (if backend is running separately)
npm run dev:client

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

---

## **5. TESTING SETUP**

### **5.1 Unit Tests**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run backend tests only
npm run test:server

# Generate coverage report
npm run test:coverage
```

### **5.2 Integration Tests**

```bash
# Run Playwright E2E tests
npm run e2e

# Run tests in headed mode (visible browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/auth.spec.ts
```

### **5.3 Performance Testing**

```bash
# Run basic performance tests
npm run perf

# Run high-load performance tests
npm run perf:k6:high

# Run Artillery load testing
npm run perf:artillery
```

---

## **6. DEBUGGING & TROUBLESHOOTING**

### **6.1 Common Issues**

#### **Database Connection Issues**
```bash
# Check PostgreSQL service status
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Test database connection
psql -U renexus_user -d renexus_dev -c "SELECT version();"

# Reset database
npm run db:reset
```

#### **Port Conflicts**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3000 npm run dev
```

#### **Node Modules Issues**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

#### **Build Issues**
```bash
# Clear build cache
rm -rf dist .vite

# Rebuild
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### **6.2 Debugging Tools**

#### **Browser Developer Tools**
- **Network Tab**: Monitor API calls and WebSocket connections
- **Console Tab**: View client-side errors and logs
- **Application Tab**: Inspect localStorage, sessionStorage, and cookies

#### **Database Debugging**
```bash
# View all tables
psql -U renexus_user -d renexus_dev -c "\dt"

# View table structure
psql -U renexus_user -d renexus_dev -c "\d users"

# View recent queries (if logging enabled)
psql -U renexus_user -d renexus_dev -c "SELECT * FROM pg_stat_activity;"

# Check database size
psql -U renexus_user -d renexus_dev -c "SELECT pg_size_pretty(pg_database_size('renexus_dev'));"
```

#### **API Debugging**
```bash
# Test API endpoints
curl http://localhost:5000/api/health

# Test with authentication
curl -H "Authorization: Bearer <your-token>" http://localhost:5000/api/auth/user

# Test WebSocket connection
# Use browser console or WebSocket client
```

---

## **7. DEVELOPMENT BEST PRACTICES**

### **7.1 Code Quality**

#### **Linting & Formatting**
```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Type checking
npx tsc --noEmit
```

#### **Pre-commit Hooks**
```bash
# Install husky for git hooks
npm install husky --save-dev

# Set up pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run test"
```

### **7.2 Git Workflow**

#### **Branch Strategy**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
# Use GitHub/GitLab interface to create PR
```

#### **Commit Message Convention**
```bash
# Format: type(scope): description
feat(auth): add user registration
fix(ui): resolve mobile layout issue
docs(api): update endpoint documentation
test(auth): add login integration tests
refactor(db): optimize query performance
```

### **7.3 Environment Management**

#### **Development vs Production**
```typescript
// Environment-specific configuration
const config = {
  development: {
    database: { debug: true },
    logging: { level: 'debug' },
    cors: { origin: ['http://localhost:3000', 'http://localhost:5000'] }
  },
  production: {
    database: { debug: false },
    logging: { level: 'info' },
    cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') }
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

---

## **8. ADVANCED DEVELOPMENT**

### **8.1 Working with AI Services**

#### **Gemini AI Integration**
```typescript
// Test Gemini API connection
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

async function testGeminiConnection() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Hello, test message');
    console.log('Gemini API working:', result.response.text());
  } catch (error) {
    console.error('Gemini API error:', error);
  }
}
```

#### **OpenAI Integration**
```typescript
// Test OpenAI API connection
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAIConnection() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, test message' }]
    });
    console.log('OpenAI API working:', completion.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API error:', error);
  }
}
```

### **8.2 Social Media Integration Setup**

#### **YouTube API Setup**
```typescript
// Test YouTube API connection
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.YOUTUBE_CLIENT_ID,
  process.env.YOUTUBE_CLIENT_SECRET,
  process.env.YOUTUBE_REDIRECT_URI
);

async function testYouTubeConnection() {
  try {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const response = await youtube.channels.list({
      part: ['snippet'],
      mine: true
    });
    console.log('YouTube API working:', response.data.items[0].snippet.title);
  } catch (error) {
    console.error('YouTube API error:', error);
  }
}
```

#### **LinkedIn API Setup**
```typescript
// Test LinkedIn API connection
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

async function testLinkedInConnection(accessToken: string) {
  try {
    const response = await fetch(`${LINKEDIN_API_URL}/people/~`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0'
      }
    });
    const data = await response.json();
    console.log('LinkedIn API working:', data.localizedFirstName);
  } catch (error) {
    console.error('LinkedIn API error:', error);
  }
}
```

### **8.3 Performance Monitoring**

#### **Application Metrics**
```typescript
// Add performance monitoring
import { collectDefaultMetrics, register, Gauge } from 'prom-client';

// Collect default metrics
collectDefaultMetrics();

// Custom metrics
const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users'
});

const responseTime = new Gauge({
  name: 'response_time',
  help: 'Average response time'
});

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    responseTime.set(duration);
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

## **9. PRODUCTION DEPLOYMENT**

### **9.1 Build Process**

```bash
# Build for production
npm run build

# The build output will be in the 'dist' directory
ls -la dist/
```

### **9.2 Environment Configuration**

#### **Production Environment Variables**
```bash
# Production .env file
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/renexus_prod
JWT_SECRET=your-production-jwt-secret
GOOGLE_GEMINI_API_KEY=your-prod-gemini-key
OPENAI_API_KEY=your-prod-openai-key
CLOUDINARY_CLOUD_NAME=your-prod-cloudinary
REDIS_URL=redis://prod-redis:6379
```

### **9.3 Docker Deployment**

#### **Dockerfile**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/
COPY server/ ./server/
COPY shared/ ./shared/

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

# Set permissions
RUN chown -R appuser:nodejs /app
USER appuser

EXPOSE 5000

CMD ["npm", "start"]
```

#### **Docker Compose for Production**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/renexus_prod
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=renexus_prod
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## **10. MONITORING & LOGGING**

### **10.1 Application Logging**

```typescript
// Winston logging configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'renexus-api' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### **10.2 Error Tracking**

```typescript
// Sentry error tracking
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Postgres()
  ]
});

// Error boundary for async operations
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: Function) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      Sentry.captureException(error);
      logger.error('Unhandled async error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  };
};
```

---

## **11. TROUBLESHOOTING GUIDE**

### **11.1 Common Issues & Solutions**

#### **Build Failures**
```bash
# Clear all caches
rm -rf node_modules/.vite dist .cache
npm install
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for missing dependencies
npm ls --depth=0
```

#### **Database Connection Issues**
```bash
# Test database connectivity
psql -U renexus_user -d renexus_dev -c "SELECT 1;"

# Check database logs
tail -f /var/log/postgresql/postgresql-*.log

# Reset database connection pool
# Restart the application
```

#### **Memory Issues**
```bash
# Check memory usage
ps aux | grep node

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Check for memory leaks
# Use Chrome DevTools Memory tab
```

#### **API Timeouts**
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health

# Increase timeout settings
# In environment variables
API_TIMEOUT=30000  # 30 seconds

# Check database query performance
EXPLAIN ANALYZE SELECT * FROM content LIMIT 10;
```

---

## **12. DEVELOPMENT WORKFLOW SUMMARY**

### **12.1 Daily Development Cycle**

```bash
# Morning: Start development environment
npm run dev

# Code changes with hot reload
# Edit files in client/ and server/

# Test changes
npm test

# Commit changes
git add .
git commit -m "feat: implement new feature"

# Push to remote
git push origin feature/branch-name
```

### **12.2 Weekly Maintenance**

```bash
# Update dependencies
npm audit
npm update

# Run full test suite
npm run test:full

# Check code coverage
npm run test:coverage

# Update documentation
# Review and update docs in /docs directory
```

### **12.3 Before Deployment**

```bash
# Run production build
npm run build

# Run production tests
npm run test:prod

# Check bundle size
npm run analyze

# Update environment variables
# Ensure all production env vars are set

# Deploy
npm run deploy
```

---

*This comprehensive guide ensures developers can quickly set up, run, and contribute to the Renexus platform. Regular updates to this document will keep it aligned with the evolving codebase and development practices.*
