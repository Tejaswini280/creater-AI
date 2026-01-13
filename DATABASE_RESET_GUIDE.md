# Database Reset Guide

Complete guide for resetting your database - cleaning, migrating, and seeding.

## Overview

The database reset scripts provide a clean way to:
1. **Clean** - Drop all tables, sequences, and views
2. **Migrate** - Run all migrations to recreate schema
3. **Seed** - Add test data for development

## Quick Start

### Windows (PowerShell)
```powershell
.\reset-database.ps1
```

### Linux/Mac (Bash)
```bash
chmod +x reset-database.sh
./reset-database.sh
```

### Node.js (Direct)
```bash
node reset-database.cjs all
```

## Individual Commands

You can run each step separately:

### Clean Only
Drops all tables, sequences, and views:
```bash
node reset-database.cjs clean
```

### Migrate Only
Runs all migrations:
```bash
node reset-database.cjs migrate
```

### Seed Only
Adds test data:
```bash
node reset-database.cjs seed
```

## What Gets Seeded

The seed operation creates:

- **1 Test User**
  - Email: `test@example.com`
  - Username: `testuser`
  - Full Name: `Test User`

- **1 Sample Project**
  - Name: `Sample Project`
  - Platform: `youtube`
  - Niche: `Technology`

- **2 Content Items**
  - "Getting Started with AI" (draft)
  - "Top 10 Tech Trends 2025" (published)

- **2 Analytics Records**
  - Views: 1500
  - Engagement: 85

- **1 Scheduled Content**
  - Scheduled for 2 days from now

## Prerequisites

1. **Environment Variables**
   - Ensure `.env` file exists with `DATABASE_URL`
   - Example: `DATABASE_URL=postgresql://user:pass@localhost:5432/dbname`

2. **Dependencies**
   - Node.js installed
   - Required packages: `drizzle-orm`, `postgres`, `dotenv`

3. **Database Access**
   - Database must be running and accessible
   - User must have DROP/CREATE permissions

## Safety Notes

⚠️ **WARNING**: This script will **DELETE ALL DATA** in your database!

- Use only in development environments
- Never run on production databases
- Always backup important data first
- Verify DATABASE_URL before running

## Troubleshooting

### Connection Errors
```
❌ DATABASE_URL not found in environment variables
```
**Solution**: Check your `.env` file contains `DATABASE_URL`

### Permission Errors
```
❌ Error cleaning database: permission denied
```
**Solution**: Ensure database user has DROP/CREATE permissions

### Migration Errors
```
❌ Migrations folder not found
```
**Solution**: Ensure `migrations/` folder exists in project root

### Seed Errors
```
❌ Error seeding database: relation does not exist
```
**Solution**: Run migrations first: `node reset-database.cjs migrate`

## Custom Seeding

To customize the seed data, edit `reset-database.cjs` and modify the `seedDatabase()` function.

Example - Add more users:
```javascript
await sql`
  INSERT INTO users (id, username, email, full_name, created_at, updated_at)
  VALUES 
    ('user-1', 'john', 'john@example.com', 'John Doe', NOW(), NOW()),
    ('user-2', 'jane', 'jane@example.com', 'Jane Smith', NOW(), NOW())
`;
```

## Integration with Development Workflow

### Reset Before Testing
```bash
npm run db:reset && npm test
```

### Reset and Start Dev Server
```bash
npm run db:reset && npm run dev
```

### Add to package.json
```json
{
  "scripts": {
    "db:reset": "node reset-database.cjs all",
    "db:clean": "node reset-database.cjs clean",
    "db:migrate": "node reset-database.cjs migrate",
    "db:seed": "node reset-database.cjs seed"
  }
}
```

## Output Example

```
========================================
Database Reset Script
========================================

✓ Environment variables loaded

Step 1: Cleaning database...
🧹 Cleaning database...
✅ Database cleaned successfully
   - All tables dropped
   - All sequences dropped
   - All views dropped

Step 2: Running migrations...
🔄 Running migrations...
✅ Migrations completed successfully
   - Applied 19 migrations
     • 0000_nice_forgotten_one.sql
     • 0001_core_tables_clean.sql
     • 0003_additional_tables_safe.sql
     • 0004_seed_essential_data.sql
     • 0006_critical_form_database_mapping_fix.sql
     ... and 14 more

Step 3: Seeding database...
🌱 Seeding database...
✅ Test user created: test@example.com
✅ Test project created: Sample Project
✅ Sample content created
✅ Analytics data created
✅ Scheduled content created

📊 Database seeded with:
   - 1 test user (test@example.com)
   - 1 sample project
   - 2 content items
   - 2 analytics records
   - 1 scheduled content

========================================
Database Reset Complete!
========================================

Your database has been:
  ✓ Cleaned (all tables dropped)
  ✓ Migrated (schema recreated)
  ✓ Seeded (test data added)
```

## Related Scripts

- `scripts/run-migrations.js` - Run migrations only
- `scripts/seed-database.js` - Seed with production-like data
- `setup-database-simple.cjs` - Quick database setup

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your `.env` configuration
3. Ensure database is running and accessible
4. Check migration files for syntax errors
