# Creator AI Studio..

A comprehensive AI-powered content creation platform built with Node.js, React, and TypeScript.

## 🚀 Features

- **AI Content Generation**: GPT-4 and Gemini integration for text, video, and multimedia content
- **Smart Scheduling**: Advanced content scheduling with calendar integration
- **Analytics Dashboard**: Real-time analytics and performance tracking
- **Media Library**: Advanced video editing and media management
- **Project Management**: Comprehensive project workflow management
- **Real-time Collaboration**: WebSocket-powered live collaboration

## 🏗️ Tech Stack

- **Backend**: Node.js 20, Express, TypeScript
- **Frontend**: React 18, Vite, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Railway with Docker support
- **CI/CD**: GitHub Actions with automated testing

## 📋 Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- npm or yarn package manager

## 🛠️ Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Tejaswini280/creater-AI.git
cd creater-AI
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Add your API keys and database credentials
```

### 4. Database Setup
```bash
# Start PostgreSQL service
# Create database: creators_dev_db

# Run database migrations
npm run db:push
```

### 5. Start Development Server
```bash
# Start both backend and frontend
npm run dev

# Application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# WebSocket: ws://localhost:5000/ws
```

## 🚀 Deployment

### Railway Deployment (Recommended)

This project is configured for deployment on Railway with automated CI/CD.

#### First-Time Setup
1. Follow the [Railway First-Time Setup Guide](./RAILWAY_FIRST_TIME_SETUP.md)
2. Configure environment variables in Railway dashboard
3. Set up GitHub Secrets for automated deployment

#### Branch Strategy
- `dev` branch → Automatic deployment to **Staging**
- `main` branch → Automatic deployment to **Production**

#### Manual Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy to staging
railway up --service=$RAILWAY_STAGING_SERVICE_ID

# Deploy to production
railway up --service=$RAILWAY_PROD_SERVICE_ID
```

### Docker Deployment
```bash
# Build Docker image
docker build -t creator-ai-studio .

# Run container
docker run -p 5000:5000 --env-file .env creator-ai-studio
```

## 🔄 CI/CD Pipeline

### Automated Workflows

#### Staging Deployment
- **Trigger**: Push to `dev` branch
- **Process**: Test → Build → Deploy to Railway Staging
- **Environment**: Staging with test data

#### Production Deployment  
- **Trigger**: Push to `main` branch
- **Process**: Security Scan → Test → Build → Deploy to Railway Production
- **Environment**: Production with live data

### Manual Deployment Options
- GitHub Actions manual trigger
- Railway CLI direct deployment
- Docker container deployment

See [Deployment Strategy](./DEPLOYMENT_STRATEGY.md) for detailed information.

## 🌿 Branch Strategy

```
main (production)
├── dev (staging)
│   ├── feature/new-feature
│   ├── bugfix/issue-fix
│   └── feature/enhancement
└── hotfix/critical-fix
```

### Workflow
1. **Feature Development**: `feature/xyz` → `dev` → staging
2. **Testing & QA**: Validate on staging environment  
3. **Production Release**: `dev` → `main` → production
4. **Hotfixes**: `hotfix/xyz` → `main` → immediate production

See [Branch Strategy](./BRANCH_STRATEGY.md) for complete workflow details.

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# Test with coverage
npm run test

# Server-side tests
npm run test:server

# End-to-end tests
npm run e2e
```

### Performance Testing
```bash
# Performance benchmarks
npm run perf

# Load testing with k6
npm run perf:k6

# Artillery load testing
npm run perf:artillery
```

## 📊 Monitoring & Health Checks

### Health Endpoints
- **Application Health**: `GET /api/health`
- **Database Health**: `GET /api/db/perf`
- **WebSocket Stats**: `GET /api/websocket/stats`

### Metrics
- Prometheus metrics available at `/api/metrics`
- Performance monitoring with built-in instrumentation
- Real-time WebSocket connection tracking

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run check` | TypeScript type checking |
| `npm run db:push` | Push database schema |

## 🔐 Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# AI APIs
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key

# Authentication
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

### Environment-Specific Files
- `.env.example` - Development template
- `.env.staging.example` - Staging configuration
- `.env.production.example` - Production configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request to `dev` branch

### Commit Convention
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions/updates

## 📚 Documentation

- [Railway Setup Guide](./RAILWAY_FIRST_TIME_SETUP.md)
- [Deployment Strategy](./DEPLOYMENT_STRATEGY.md)
- [Branch Strategy](./BRANCH_STRATEGY.md)
- [API Documentation](./docs/API.md)

## 🐛 Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database status
npm run db:push

# Verify connection string
echo $DATABASE_URL
```

#### Build Failures
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist/
npm run build
```

#### Deployment Issues
```bash
# Check Railway service status
railway status

# View deployment logs
railway logs

# Manual deployment
railway up
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 integration
- Google for Gemini AI services
- Railway for deployment platform
- The open-source community for amazing tools and libraries

---

**🌟 Star this repository if you find it helpful!**

For support, please open an issue or contact the development team.