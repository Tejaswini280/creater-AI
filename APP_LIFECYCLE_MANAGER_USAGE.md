# 🧰 Creator AI Studio - App Lifecycle Manager

## Quick Start

The `run-creator-ai-studio.mjs` script provides enterprise-grade lifecycle management for the entire Creator AI Studio application stack.

### One-Command Setup & Start

```bash
# First time setup (installs deps, sets up DB, builds app)
node run-creator-ai-studio.mjs setup

# Start everything (frontend, backend, database)
node run-creator-ai-studio.mjs start

# Check status
node run-creator-ai-studio.mjs status

# View logs
node run-creator-ai-studio.mjs logs --follow

# Stop everything
node run-creator-ai-studio.mjs stop
```

### Alternative: Use npm scripts

```bash
npm run setup
npm run app:start
npm run app:status
npm run app:logs
npm run app:stop
```

## Cross-Platform Support

### macOS/Linux
```bash
# Make executable
chmod +x run-creator-ai-studio.mjs

# Run directly
./run-creator-ai-studio.mjs start
```

### Windows
```bash
# Run with Node
node run-creator-ai-studio.mjs start
```

## Commands

### `setup` - First-time setup
Prepares the repository for development:
- Installs all dependencies (root + frontend if separate)
- Creates `.env` from `.env.example` or minimal template
- Starts database services (Docker)
- Runs database migrations
- Seeds database with initial data
- Builds application

```bash
node run-creator-ai-studio.mjs setup
node run-creator-ai-studio.mjs setup --skip-db --skip-build
```

### `start` - Start all services
Starts the complete application stack:
- Resolves port conflicts (asks before killing processes)
- Starts database services (PostgreSQL + Redis via Docker)
- Runs database migrations
- Starts backend server (Express on port 5000)
- Starts frontend dev server (Vite on port 3000)
- Health checks all services

```bash
node run-creator-ai-studio.mjs start
node run-creator-ai-studio.mjs start --seed --force
node run-creator-ai-studio.mjs start --frontend-port=3001 --backend-port=5001
```

### `stop` - Stop all services
Gracefully stops all managed services:
- Stops frontend and backend processes
- Optionally stops Docker services
- Cleans up PID files and state

```bash
node run-creator-ai-studio.mjs stop
node run-creator-ai-studio.mjs stop --down-db --down-redis
```

### `restart` - Restart services
Equivalent to `stop` then `start`:

```bash
node run-creator-ai-studio.mjs restart
node run-creator-ai-studio.mjs restart --seed
```

### `status` - Show current status
Displays status of all services:
- Process status (running/stale)
- Port availability
- Service URLs and log files
- Last state update time

```bash
node run-creator-ai-studio.mjs status
```

### `logs` - View service logs
Show or stream logs from services:

```bash
# Show last 200 lines from all services
node run-creator-ai-studio.mjs logs

# Stream logs (like tail -f)
node run-creator-ai-studio.mjs logs --follow

# Show specific service logs
node run-creator-ai-studio.mjs logs --service=backend --lines=500

# Available services: frontend, backend, db, redis, all
```

### `clean` - Reset to clean state
Removes build artifacts and resets state:
- Stops all services first
- Removes build outputs (`dist/`, `build/`, `.next/`)
- Removes runtime files (`.app-manager/`)
- Optionally removes `node_modules`
- Optionally removes Docker volumes

```bash
node run-creator-ai-studio.mjs clean
node run-creator-ai-studio.mjs clean --remove-node-modules --yes
node run-creator-ai-studio.mjs clean --remove-volumes --yes
```

### `db:reset` - Database operations
Reset or update database schema:

```bash
# Safe schema update (no data loss)
node run-creator-ai-studio.mjs db:reset

# Full destructive reset (removes all data)
node run-creator-ai-studio.mjs db:reset --full-reset --yes

# Reset without seeding
node run-creator-ai-studio.mjs db:reset --full-reset --skip-seed --yes
```

### `doctor` - Diagnostics
Run comprehensive health checks:
- Node.js version
- Package manager availability
- Docker and Docker Compose
- Port availability
- Environment file presence
- Database connectivity

```bash
node run-creator-ai-studio.mjs doctor
```

## Configuration

### Environment Variables
The script respects these environment variables:
- `NODE_ENV` - Environment mode
- `PORT` - Backend port
- `DATABASE_URL` - Database connection string
- `SKIP_RATE_LIMIT` - Skip rate limiting in development

### Port Configuration
Default ports (can be overridden):
- Frontend: 3000 (Vite dev server)
- Backend: 5000 (Express server)
- PostgreSQL: 5432
- Redis: 6379

Override via flags:
```bash
node run-creator-ai-studio.mjs start --frontend-port=3001 --backend-port=5001
```

### Auto-Detection
The script automatically detects:
- **App name**: From `package.json.name` or directory name
- **Package manager**: pnpm > yarn > npm (based on lock files)
- **Database tooling**: Drizzle (preferred) or Prisma
- **Docker setup**: docker-compose.yml presence
- **Frontend framework**: Vite (detected from config)
- **Build requirements**: Based on package.json scripts

## Safety Features

### Concurrency Protection
- Uses lock files to prevent concurrent runs
- Shows who holds the lock and when it was created
- `--force-lock` to override stale locks

### Port Conflict Resolution
- Detects processes using required ports
- Shows PID and process name
- Asks before killing unknown processes
- `--force` or `--yes` to kill automatically
- `--no-kill` to fail instead of killing

### Atomic State Management
- State files written atomically (temp file + rename)
- Never corrupts state even on crash
- Tracks PIDs, ports, log files, timestamps

### Graceful Shutdown
- Handles Ctrl+C gracefully
- Stops child processes
- Cleans up lock files
- Preserves state for next run

## Advanced Usage

### CI/CD Mode
```bash
# Non-interactive mode for CI
node run-creator-ai-studio.mjs start --ci --yes --force

# Skip prompts and confirmations
node run-creator-ai-studio.mjs clean --remove-node-modules --ci --yes
```

### Development Workflow
```bash
# Full development setup
node run-creator-ai-studio.mjs setup
node run-creator-ai-studio.mjs start --seed

# Quick restart after code changes
node run-creator-ai-studio.mjs restart

# Debug with verbose logging
node run-creator-ai-studio.mjs start --debug

# Clean rebuild
node run-creator-ai-studio.mjs clean
node run-creator-ai-studio.mjs setup --skip-db
```

### Production Deployment
```bash
# Production build and start
NODE_ENV=production node run-creator-ai-studio.mjs setup --skip-db
NODE_ENV=production node run-creator-ai-studio.mjs start --skip-db --no-seed
```

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check what's using ports
node run-creator-ai-studio.mjs doctor

# Force kill conflicting processes
node run-creator-ai-studio.mjs start --force
```

**Database connection issues:**
```bash
# Check Docker services
docker compose ps

# Reset database
node run-creator-ai-studio.mjs db:reset --full-reset --yes
```

**Stale processes:**
```bash
# Check status
node run-creator-ai-studio.mjs status

# Clean restart
node run-creator-ai-studio.mjs stop --force
node run-creator-ai-studio.mjs start
```

**Build issues:**
```bash
# Clean rebuild
node run-creator-ai-studio.mjs clean
node run-creator-ai-studio.mjs setup
```

### Debug Mode
Enable verbose logging:
```bash
node run-creator-ai-studio.mjs start --debug
```

### Log Files
Service logs are stored in `.app-manager/logs/`:
- `frontend.log` - Vite dev server logs
- `backend.log` - Express server logs
- `db.log` - Database service logs (if managed)
- `redis.log` - Redis service logs (if managed)

## File Structure

The script creates a runtime directory:
```
.app-manager/
├── state.json          # Current service state (PIDs, ports, etc.)
├── lock               # Concurrency lock file
└── logs/              # Service log files
    ├── frontend.log
    ├── backend.log
    ├── db.log
    └── redis.log
```

## Integration with Existing Scripts

The lifecycle manager works alongside existing npm scripts:
- `npm run dev` - Still works for backend-only development
- `npm run build` - Still works for manual builds
- `npm run start` - Still works for production starts
- `npm run db:*` - Still works for database operations

The lifecycle manager adds orchestration on top of these existing scripts.