#!/usr/bin/env pwsh

Write-Host "🔧 Running database migrations..." -ForegroundColor Yellow

# Copy migration file to container and run it
docker cp migrations/0000_nice_forgotten_one.sql creator-ai-postgres:/tmp/migration.sql

# Run the migration
docker exec creator-ai-postgres psql -U postgres -d creators_dev_db -f /tmp/migration.sql

# Check if tables were created
Write-Host "📋 Checking created tables..." -ForegroundColor Green
docker exec creator-ai-postgres psql -U postgres -d creators_dev_db -c "\dt"

Write-Host "✅ Database migration completed!" -ForegroundColor Green