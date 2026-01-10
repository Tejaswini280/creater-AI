# Requirements Document

## Introduction

The application is currently failing to start due to database migration issues. The core problem is that migration `0001_core_tables_idempotent.sql` is failing because it references a `project_id` column that doesn't exist in the current database state. This creates a circular dependency where the migration can't complete, preventing the application from starting.

## Glossary

- **Migration_System**: The database migration management system that applies schema changes
- **Schema_State**: The current structure and data in the database
- **Migration_Lock**: PostgreSQL advisory lock mechanism to prevent concurrent migrations
- **Idempotent_Migration**: A migration that can be run multiple times safely without causing errors
- **Column_Dependency**: When one database operation depends on the existence of a column created by another operation

## Requirements

### Requirement 1: Fix Migration Execution Order

**User Story:** As a system administrator, I want database migrations to execute in the correct order without circular dependencies, so that the application can start successfully.

#### Acceptance Criteria

1. WHEN the migration system runs, THE Migration_System SHALL execute migrations in dependency order
2. WHEN a migration references a column, THE Migration_System SHALL ensure that column exists before the reference
3. WHEN migrations encounter missing dependencies, THE Migration_System SHALL provide clear error messages
4. WHEN migrations are retried, THE Migration_System SHALL handle partial completion states gracefully

### Requirement 2: Resolve Column Reference Issues

**User Story:** As a database administrator, I want all column references in migrations to be valid, so that schema changes can be applied without errors.

#### Acceptance Criteria

1. WHEN a migration references `project_id`, THE Migration_System SHALL ensure the column exists in the target table
2. WHEN creating indexes on columns, THE Migration_System SHALL verify column existence first
3. WHEN adding foreign key constraints, THE Migration_System SHALL validate both source and target columns exist
4. IF a column reference is invalid, THEN THE Migration_System SHALL skip that operation and log the issue

### Requirement 3: Implement Safe Migration Recovery

**User Story:** As a system operator, I want the ability to recover from failed migrations, so that I can restore the application to a working state.

#### Acceptance Criteria

1. WHEN a migration fails, THE Migration_System SHALL record the failure state in the tracking table
2. WHEN retrying migrations, THE Migration_System SHALL skip successfully completed operations
3. WHEN detecting schema inconsistencies, THE Migration_System SHALL provide repair options
4. WHEN rolling back changes, THE Migration_System SHALL restore the previous schema state safely

### Requirement 4: Ensure Database Schema Consistency

**User Story:** As a developer, I want the database schema to match the application's expectations, so that all features work correctly.

#### Acceptance Criteria

1. WHEN the application starts, THE Schema_State SHALL contain all required tables and columns
2. WHEN queries reference columns, THE Schema_State SHALL have those columns available
3. WHEN foreign key relationships are used, THE Schema_State SHALL have proper constraints defined
4. WHEN indexes are needed for performance, THE Schema_State SHALL have those indexes created

### Requirement 5: Provide Migration Status Visibility

**User Story:** As a system administrator, I want clear visibility into migration status and progress, so that I can troubleshoot issues effectively.

#### Acceptance Criteria

1. WHEN migrations are running, THE Migration_System SHALL log detailed progress information
2. WHEN migrations fail, THE Migration_System SHALL provide specific error details and context
3. WHEN checking migration status, THE Migration_System SHALL show which migrations completed successfully
4. WHEN diagnosing issues, THE Migration_System SHALL provide schema validation reports

### Requirement 6: Handle Production Database Safety

**User Story:** As a production operator, I want migrations to be safe for production environments, so that I don't risk data loss or extended downtime.

#### Acceptance Criteria

1. WHEN running in production, THE Migration_System SHALL use advisory locks to prevent concurrent execution
2. WHEN applying schema changes, THE Migration_System SHALL use idempotent operations that can be safely retried
3. WHEN encountering existing data, THE Migration_System SHALL preserve all existing records
4. WHEN creating constraints, THE Migration_System SHALL validate data compatibility before applying changes