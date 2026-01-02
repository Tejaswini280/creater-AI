# Database Configuration Guide

This document explains how to configure and use the database settings for the Renexus project across different environments.

## Environment Files

The project now supports environment-specific database configuration through the following files:

- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment
- `.env` - Default/fallback environment file

## Database Configuration Variables

### Individual Environment Variables (Recommended)

```bash
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=your_database_host
DB_PORT=5432
```

### Alternative: DATABASE_URL

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

## Environment Configurations

### Development
```bash
DB_NAME=creators_dev_db
DB_USER=creators_dev_user
DB_PASSWORD=CreatorsDev54321
DB_HOST=localhost
DB_PORT=5432
```

### Staging
```bash
DB_NAME=creators_staging_db
DB_USER=creators_staging_user
DB_PASSWORD=CreatorsDev54321
DB_HOST=db
DB_PORT=5432
```

### Production
```bash
DB_NAME=creators_prod_db
DB_USER=creators_prod_user
DB_PASSWORD=CreatorsDev54321
DB_HOST=<prod-host>
DB_PORT=5432
```

## Usage

### 1. Environment Loading

The project automatically loads the appropriate environment file based on `NODE_ENV`:

```bash
# Development (default)
npm run dev

# Staging
NODE_ENV=staging npm run dev

# Production
NODE_ENV=production npm start
```

### 2. Manual Environment Loading

Use the environment loader script:

```bash
# Load development environment
node scripts/load-env.js

# Load specific environment
NODE_ENV=staging node scripts/load-env.js
NODE_ENV=production node scripts/load-env.js
```

### 3. Database Connection Testing

Test database connectivity:

```bash
# Test with current environment
node scripts/test-db-connection.js

# Test with specific environment
NODE_ENV=staging node scripts/test-db-connection.js
```

## Configuration Priority

1. **DATABASE_URL** (if provided, overrides individual variables)
2. **Individual DB_* variables** (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT)
3. **Default fallback values** (creatornexus, postgres, postgres, localhost, 5432)

## Database Setup Scripts

### Drizzle ORM Commands

```bash
# Push schema changes to database
npm run db:push

# Generate migrations
drizzle-kit generate

# Apply migrations
drizzle-kit migrate
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure PostgreSQL server is running
   - Check database host and port settings
   - Verify network connectivity

2. **Authentication Failed**
   - Verify database username and password
   - Check user permissions on the database
   - Ensure the database user exists

3. **Database Does Not Exist**
   - Create the database if it doesn't exist
   - Check database name spelling
   - Verify user has permission to access the database

### Environment File Issues

- Ensure `.env.*` files are in the project root
- Check file permissions
- Verify variable names and values
- Use the environment loader script to debug

## Security Notes

- Never commit `.env*` files to version control
- Use strong passwords for database users
- Consider using environment-specific credentials
- Rotate passwords regularly
- Use connection pooling in production

## Migration from Old Configuration

If migrating from the old configuration:

1. Create the appropriate `.env.*` files
2. Update your deployment scripts to set `NODE_ENV`
3. Test database connectivity with the new configuration
4. Update any hardcoded database references

## Support

For issues with database configuration:

1. Run `node scripts/load-env.js` to verify environment loading
2. Run `node scripts/test-db-connection.js` to test connectivity
3. Check database server logs
4. Verify network connectivity to database host
