# Docker Setup Guide for Creator AI Studio

## Option 1: Install Docker Desktop (Recommended)

### Windows Installation:
1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop/
2. Run the installer and follow the setup wizard
3. Restart your computer when prompted
4. Launch Docker Desktop and wait for it to start
5. Verify installation by running: `docker --version`

### After Docker Installation:
```powershell
# Run the application with Docker
.\run-docker.ps1

# Or manually:
docker-compose up --build
```

## Option 2: Run Locally Without Docker

If you prefer to run without Docker, you'll need:

### Prerequisites:
1. **Node.js 20+** (already installed)
2. **PostgreSQL** (install locally)
3. **Redis** (optional, for sessions)

### Local Setup Steps:

#### 1. Install PostgreSQL:
```powershell
# Using Chocolatey (if installed)
choco install postgresql

# Or download from: https://www.postgresql.org/download/windows/
```

#### 2. Setup Database:
```powershell
# Connect to PostgreSQL
psql -U postgres

# Run the database setup
\i database-setup.sql
```

#### 3. Install Dependencies and Run:
```powershell
# Install dependencies
npm install

# Build the application
npm run build

# Start the application
npm start
```

## Option 3: Use Railway/Cloud Database

Update your `.env` file to use a cloud database:

```env
# Use Railway or other cloud PostgreSQL
DATABASE_URL=postgresql://username:password@host:port/database
```

Then run locally:
```powershell
npm run dev
```

## Verification

Once running (any method), verify the application:
- Open: http://localhost:5000
- Health check: http://localhost:5000/api/health
- Should return: `{"status": "healthy", ...}`

## Troubleshooting

### Docker Issues:
- Ensure Docker Desktop is running
- Check Windows virtualization is enabled
- Try running PowerShell as Administrator

### Local Database Issues:
- Ensure PostgreSQL service is running
- Check connection string in `.env`
- Verify database exists and user has permissions

### Port Conflicts:
- If port 5000 is busy, change PORT in `.env`
- Check if other services are using ports 5432 (PostgreSQL) or 6379 (Redis)