#!/usr/bin/env pwsh

Write-Host "🔧 FIXING DOCKER DATABASE SCHEMA" -ForegroundColor Green

# Stop containers
docker-compose down

# Reset database completely
docker volume rm creatornexus_postgres_data -f

# Start fresh
docker-compose up -d

# Wait for database
Write-Host "⏳ Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Create basic schema
Write-Host "📊 Creating database schema..." -ForegroundColor Cyan
docker exec creator-ai-postgres psql -U postgres -d creators_dev_db -c "
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scheduled_content (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    project_id INTEGER REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    platform VARCHAR(100),
    scheduled_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (email, password_hash, name) VALUES 
('test@example.com', '\$2b\$10\$dummy.hash.for.testing', 'Test User')
ON CONFLICT (email) DO NOTHING;
"

Write-Host "✅ Database schema created!" -ForegroundColor Green

# Restart app container
docker restart creator-ai-app

# Wait and test
Start-Sleep -Seconds 10
Write-Host "🧪 Testing application..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 10
    Write-Host "✅ Application is healthy: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Application still unhealthy" -ForegroundColor Red
    docker logs creator-ai-app --tail 5
}

Write-Host "🏁 Fix complete!" -ForegroundColor Green