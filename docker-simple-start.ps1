#!/usr/bin/env pwsh

Write-Host ""
Write-Host "QUICK DOCKER START - BYPASSING COMPLEX MIGRATIONS" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean up any existing containers
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose down -v 2>$null

# Step 2: Start database and Redis first
Write-Host "Starting database and Redis..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Step 3: Wait for database to be ready
Write-Host "Waiting for database to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

do {
    $attempt++
    Write-Host "   Attempt $attempt/$maxAttempts..." -ForegroundColor Gray
    
    $dbReady = docker exec creator-ai-postgres pg_isready -U postgres 2>$null
    if ($dbReady -match "accepting connections") {
        Write-Host "Database is ready!" -ForegroundColor Green
        break
    }
    
    if ($attempt -ge $maxAttempts) {
        Write-Host "Database failed to start after $maxAttempts attempts" -ForegroundColor Red
        exit 1
    }
    
    Start-Sleep -Seconds 2
} while ($true)

# Step 4: Create a minimal database schema
Write-Host "Creating minimal database schema..." -ForegroundColor Yellow
$minimalSchema = @"
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    project_id INTEGER,
    title VARCHAR NOT NULL,
    content TEXT,
    platform VARCHAR,
    status VARCHAR DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR,
    type VARCHAR,
    content TEXT,
    tags TEXT[],
    rating DECIMAL DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hashtag_suggestions (
    id SERIAL PRIMARY KEY,
    platform VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    hashtag VARCHAR NOT NULL,
    trend_score INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, category, hashtag)
);

CREATE TABLE IF NOT EXISTS ai_engagement_patterns (
    id SERIAL PRIMARY KEY,
    platform VARCHAR NOT NULL,
    category VARCHAR NOT NULL,
    optimal_times TEXT[],
    engagement_score DECIMAL DEFAULT 0,
    sample_size INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, category)
);

CREATE TABLE IF NOT EXISTS niches (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    category VARCHAR,
    trend_score INTEGER DEFAULT 0,
    difficulty VARCHAR,
    profitability VARCHAR,
    keywords TEXT[],
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO users (id, email, password, first_name, last_name) 
VALUES ('test-user-id', 'test@creatornexus.com', 'password123', 'Test', 'User')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ai_engagement_patterns (platform, category, optimal_times, engagement_score, sample_size)
VALUES 
    ('instagram', 'fitness', ARRAY['09:00', '12:00', '17:00'], 0.85, 1000),
    ('youtube', 'tech', ARRAY['15:00', '21:00'], 0.87, 600),
    ('tiktok', 'lifestyle', ARRAY['17:00', '19:00', '21:00'], 0.89, 1300)
ON CONFLICT (platform, category) DO NOTHING;

INSERT INTO hashtag_suggestions (platform, category, hashtag, trend_score, usage_count)
VALUES 
    ('instagram', 'fitness', '#FitnessMotivation', 95, 5000),
    ('instagram', 'tech', '#TechTips', 78, 1500),
    ('instagram', 'lifestyle', '#LifestyleBlogger', 83, 2200)
ON CONFLICT (platform, category, hashtag) DO NOTHING;

SELECT 'Database schema created successfully' as status;
"@

# Write schema to temp file and execute
$schemaFile = "temp-minimal-schema.sql"
$minimalSchema | Out-File -FilePath $schemaFile -Encoding UTF8

try {
    Get-Content $schemaFile | docker exec -i creator-ai-postgres psql -U postgres -d creators_dev_db
    Write-Host "Minimal schema created successfully!" -ForegroundColor Green
} catch {
    Write-Host "Schema creation had some issues, but continuing..." -ForegroundColor Yellow
} finally {
    Remove-Item $schemaFile -ErrorAction SilentlyContinue
}

# Step 5: Start the application with simplified environment
Write-Host "Starting application with simplified configuration..." -ForegroundColor Yellow

# Create a simplified docker-compose override
$simpleOverride = @"
version: '3.8'
services:
  app:
    environment:
      - NODE_ENV=development
      - SKIP_MIGRATIONS=1
      - SKIP_SEEDING=1
      - SKIP_RATE_LIMIT=1
      - PERF_MODE=0
      - SECURE_COOKIES=false
      - TRUST_PROXY=false
    command: ["sh", "-c", "NODE_ENV=development SKIP_MIGRATIONS=1 SKIP_SEEDING=1 node dist/index.js"]
"@

$simpleOverride | Out-File -FilePath "docker-compose.simple-override.yml" -Encoding UTF8

# Start the application
docker-compose -f docker-compose.yml -f docker-compose.simple-override.yml up -d app

Write-Host ""
Write-Host "APPLICATION STARTING WITH SIMPLIFIED CONFIGURATION" -ForegroundColor Green
Write-Host ""
Write-Host "Application URL: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Health Check: http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "Test Login: test@creatornexus.com / password123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Checking application status..." -ForegroundColor Yellow

# Wait a moment for startup
Start-Sleep -Seconds 5

# Check if application is responding
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 10 -ErrorAction Stop
    Write-Host "Application is responding! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Application may still be starting up..." -ForegroundColor Yellow
    Write-Host "   Check logs with: docker logs creator-ai-app -f" -ForegroundColor Gray
}

Write-Host ""
Write-Host "To view logs: docker logs creator-ai-app -f" -ForegroundColor Gray
Write-Host "To stop: docker-compose down" -ForegroundColor Gray
Write-Host ""