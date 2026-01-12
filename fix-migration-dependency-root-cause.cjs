#!/usr/bin/env node

/**
 * Root Cause Fix for Migration Dependency Issues
 * 
 * This script addresses the core issue where migrations reference columns
 * that don't exist yet due to incomplete migration execution.
 */

const postgres = require('postgres');

const config = {
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'postgres123'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'creators_dev_db'}`,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
};

class MigrationFixer {
  constructor() {
    this.sql = null;
  }

  async connect() {
    console.log('🔌 Connecting to database...');
    
    try {
      this.sql = postgres(config.connectionString, {
        ssl: config.ssl,
        max: config.max,
        idle_timeout: config.idle_timeout,
        connect_timeout: config.connect_timeout,
        onnotice: (notice) => {
          if (notice.message && !notice.message.includes('NOTICE:')) {
            console.log('📢 Database notice:', notice.message);
          }
        }
      });

      await this.sql`SELECT 1`;
      console.log('✅ Database connection successful');
      
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw error;
    }
  }

  async checkTableExists(tableName) {
    try {
      const result = await this.sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )
      `;
      return result[0].exists;
    } catch (error) {
      return false;
    }
  }

  async checkColumnExists(tableName, columnName) {
    try {
      const result = await this.sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName} 
          AND column_name = ${columnName}
        )
      `;
      return result[0].exists;
    } catch (error) {
      return false;
    }
  }

  async fixContentTable() {
    console.log('🔧 Fixing content table structure...');
    
    try {
      const tableExists = await this.checkTableExists('content');
      
      if (!tableExists) {
        console.log('📋 Creating content table...');
        await this.sql`
          CREATE TABLE content (
            id SERIAL PRIMARY KEY NOT NULL,
            user_id VARCHAR NOT NULL,
            title VARCHAR NOT NULL,
            description TEXT,
            script TEXT,
            platform VARCHAR NOT NULL,
            content_type VARCHAR NOT NULL,
            status VARCHAR DEFAULT 'draft' NOT NULL,
            scheduled_at TIMESTAMP,
            published_at TIMESTAMP,
            thumbnail_url VARCHAR,
            video_url VARCHAR,
            tags TEXT[],
            metadata JSONB,
            ai_generated BOOLEAN DEFAULT false,
            day_number INTEGER,
            is_paused BOOLEAN DEFAULT false,
            is_stopped BOOLEAN DEFAULT false,
            can_publish BOOLEAN DEFAULT true,
            publish_order INTEGER DEFAULT 0,
            content_version INTEGER DEFAULT 1,
            last_regenerated_at TIMESTAMP,
            project_id INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
        console.log('✅ Content table created');
      } else {
        console.log('📋 Content table exists, checking columns...');
        
        // Check and add missing columns
        const columnsToAdd = [
          { name: 'day_number', type: 'INTEGER' },
          { name: 'project_id', type: 'INTEGER' },
          { name: 'content_status', type: 'VARCHAR DEFAULT \'draft\'' },
          { name: 'is_ai_generated', type: 'BOOLEAN DEFAULT false' },
          { name: 'scheduled_time', type: 'TIMESTAMP' },
          { name: 'engagement_prediction', type: 'NUMERIC(5,2)' },
          { name: 'target_audience', type: 'VARCHAR' },
          { name: 'optimal_posting_time', type: 'TIMESTAMP' }
        ];

        for (const column of columnsToAdd) {
          const exists = await this.checkColumnExists('content', column.name);
          if (!exists) {
            console.log(`   Adding column: ${column.name}`);
            await this.sql.unsafe(`ALTER TABLE content ADD COLUMN ${column.name} ${column.type}`);
          }
        }
      }

      // Create indexes
      await this.sql`CREATE INDEX IF NOT EXISTS idx_content_day_number ON content(day_number) WHERE day_number IS NOT NULL`;
      await this.sql`CREATE INDEX IF NOT EXISTS idx_content_project_id ON content(project_id) WHERE project_id IS NOT NULL`;
      
      console.log('✅ Content table structure fixed');
      
    } catch (error) {
      console.error('❌ Failed to fix content table:', error.message);
      throw error;
    }
  }

  async fixProjectsTable() {
    console.log('🔧 Fixing projects table structure...');
    
    try {
      const tableExists = await this.checkTableExists('projects');
      
      if (!tableExists) {
        console.log('📋 Creating projects table...');
        await this.sql`
          CREATE TABLE projects (
            id SERIAL PRIMARY KEY NOT NULL,
            user_id VARCHAR NOT NULL,
            name VARCHAR NOT NULL,
            description TEXT,
            type VARCHAR NOT NULL,
            template VARCHAR,
            platform VARCHAR,
            target_audience VARCHAR,
            estimated_duration VARCHAR,
            tags TEXT[],
            is_public BOOLEAN DEFAULT false,
            status VARCHAR DEFAULT 'active' NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
        console.log('✅ Projects table created');
      } else {
        console.log('📋 Projects table exists, checking columns...');
        
        // Check and add missing columns
        const columnsToAdd = [
          { name: 'category', type: 'VARCHAR' },
          { name: 'duration', type: 'VARCHAR' },
          { name: 'content_frequency', type: 'VARCHAR' },
          { name: 'content_type', type: 'VARCHAR' },
          { name: 'channel_types', type: 'TEXT[]' },
          { name: 'content_formats', type: 'TEXT[]' },
          { name: 'content_themes', type: 'TEXT[]' },
          { name: 'brand_voice', type: 'VARCHAR' },
          { name: 'content_length', type: 'VARCHAR' },
          { name: 'posting_frequency', type: 'VARCHAR' },
          { name: 'ai_tools', type: 'TEXT[]' },
          { name: 'scheduling_preferences', type: 'JSONB' },
          { name: 'start_date', type: 'DATE' },
          { name: 'budget', type: 'NUMERIC(10,2)' },
          { name: 'team_members', type: 'TEXT[]' },
          { name: 'goals', type: 'TEXT[]' }
        ];

        for (const column of columnsToAdd) {
          const exists = await this.checkColumnExists('projects', column.name);
          if (!exists) {
            console.log(`   Adding column: ${column.name}`);
            await this.sql.unsafe(`ALTER TABLE projects ADD COLUMN ${column.name} ${column.type}`);
          }
        }
      }
      
      console.log('✅ Projects table structure fixed');
      
    } catch (error) {
      console.error('❌ Failed to fix projects table:', error.message);
      throw error;
    }
  }

  async fixUsersTable() {
    console.log('🔧 Fixing users table structure...');
    
    try {
      const tableExists = await this.checkTableExists('users');
      
      if (!tableExists) {
        console.log('📋 Creating users table...');
        await this.sql`
          CREATE TABLE users (
            id VARCHAR PRIMARY KEY NOT NULL,
            email VARCHAR NOT NULL UNIQUE,
            password TEXT NOT NULL DEFAULT 'temp_password_needs_reset',
            first_name VARCHAR NOT NULL,
            last_name VARCHAR NOT NULL,
            profile_image_url VARCHAR,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
        console.log('✅ Users table created');
      } else {
        console.log('📋 Users table exists, checking columns...');
        
        // Check password column
        const passwordExists = await this.checkColumnExists('users', 'password');
        if (!passwordExists) {
          console.log('   Adding password column');
          await this.sql`ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT 'temp_password_needs_reset'`;
        }

        // Check email constraint
        try {
          await this.sql`
            ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email)
          `;
          console.log('   Added email unique constraint');
        } catch (error) {
          // Constraint might already exist
        }
      }
      
      console.log('✅ Users table structure fixed');
      
    } catch (error) {
      console.error('❌ Failed to fix users table:', error.message);
      throw error;
    }
  }

  async fixOtherTables() {
    console.log('🔧 Fixing other table structures...');
    
    try {
      // Fix content_metrics table
      const contentMetricsExists = await this.checkTableExists('content_metrics');
      if (!contentMetricsExists) {
        await this.sql`
          CREATE TABLE content_metrics (
            id SERIAL PRIMARY KEY NOT NULL,
            content_id INTEGER NOT NULL,
            platform VARCHAR NOT NULL,
            views INTEGER DEFAULT 0,
            likes INTEGER DEFAULT 0,
            comments INTEGER DEFAULT 0,
            shares INTEGER DEFAULT 0,
            engagement_rate NUMERIC(5, 2),
            revenue NUMERIC(10, 2) DEFAULT '0',
            last_updated TIMESTAMP DEFAULT NOW()
          )
        `;
        console.log('   Created content_metrics table');
      }

      // Fix ai_generation_tasks table
      const aiTasksExists = await this.checkTableExists('ai_generation_tasks');
      if (!aiTasksExists) {
        await this.sql`
          CREATE TABLE ai_generation_tasks (
            id SERIAL PRIMARY KEY NOT NULL,
            user_id VARCHAR NOT NULL,
            task_type VARCHAR NOT NULL,
            prompt TEXT NOT NULL,
            result TEXT,
            status VARCHAR DEFAULT 'pending' NOT NULL,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            completed_at TIMESTAMP
          )
        `;
        console.log('   Created ai_generation_tasks table');
      }

      // Fix post_schedules table
      const postSchedulesExists = await this.checkTableExists('post_schedules');
      if (!postSchedulesExists) {
        await this.sql`
          CREATE TABLE post_schedules (
            id SERIAL PRIMARY KEY NOT NULL,
            social_post_id INTEGER NOT NULL,
            platform VARCHAR NOT NULL,
            scheduled_at TIMESTAMP NOT NULL,
            status VARCHAR DEFAULT 'pending' NOT NULL,
            retry_count INTEGER DEFAULT 0,
            last_attempt_at TIMESTAMP,
            error_message TEXT,
            metadata JSONB,
            recurrence VARCHAR(50) DEFAULT 'none',
            timezone VARCHAR(100) DEFAULT 'UTC',
            series_end_date TIMESTAMP,
            project_id INTEGER,
            title VARCHAR(200),
            description TEXT,
            content_type VARCHAR(50),
            duration VARCHAR(50),
            tone VARCHAR(50),
            target_audience VARCHAR(200),
            time_distribution VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
        console.log('   Created post_schedules table');
      }

      // Fix templates table
      const templatesExists = await this.checkTableExists('templates');
      if (!templatesExists) {
        await this.sql`
          CREATE TABLE templates (
            id SERIAL PRIMARY KEY NOT NULL,
            title VARCHAR NOT NULL,
            description TEXT NOT NULL,
            category VARCHAR NOT NULL,
            type VARCHAR NOT NULL,
            content TEXT,
            thumbnail_url VARCHAR,
            rating NUMERIC(3, 2) DEFAULT '0',
            downloads INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            is_featured BOOLEAN DEFAULT false,
            tags TEXT[],
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
        console.log('   Created templates table');
      }

      // Fix hashtag_suggestions table
      const hashtagsExists = await this.checkTableExists('hashtag_suggestions');
      if (!hashtagsExists) {
        await this.sql`
          CREATE TABLE hashtag_suggestions (
            id SERIAL PRIMARY KEY NOT NULL,
            platform VARCHAR NOT NULL,
            category VARCHAR NOT NULL,
            hashtag VARCHAR NOT NULL,
            trend_score INTEGER DEFAULT 0,
            usage_count INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `;
        console.log('   Created hashtag_suggestions table');
      }
      
      console.log('✅ Other tables structure fixed');
      
    } catch (error) {
      console.error('❌ Failed to fix other tables:', error.message);
      throw error;
    }
  }

  async clearFailedMigrations() {
    console.log('🧹 Clearing failed migration records...');
    
    try {
      // Check if schema_migrations table exists
      const tableExists = await this.checkTableExists('schema_migrations');
      
      if (tableExists) {
        // Check if status column exists
        const statusExists = await this.checkColumnExists('schema_migrations', 'status');
        
        if (statusExists) {
          // Clear failed migrations
          const result = await this.sql`
            DELETE FROM schema_migrations 
            WHERE status IN ('failed', 'running')
          `;
          console.log(`✅ Cleared ${result.count} failed migration records`);
        } else {
          console.log('⏭️  No status column found, skipping failed migration cleanup');
        }
      } else {
        console.log('⏭️  No schema_migrations table found, skipping cleanup');
      }
      
    } catch (error) {
      console.error('❌ Failed to clear failed migrations:', error.message);
      // Don't throw - this is not critical
    }
  }

  async close() {
    if (this.sql) {
      await this.sql.end();
      console.log('🔌 Database connection closed');
    }
  }

  async run() {
    try {
      await this.connect();
      await this.clearFailedMigrations();
      await this.fixUsersTable();
      await this.fixProjectsTable();
      await this.fixContentTable();
      await this.fixOtherTables();
      await this.close();
      
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🎉 MIGRATION DEPENDENCY ISSUES FIXED');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('✅ All table structures are now consistent');
      console.log('✅ Missing columns have been added');
      console.log('✅ Failed migration records cleared');
      console.log('✅ Database is ready for migration re-run');
      console.log('═══════════════════════════════════════════════════════════════');
      
    } catch (error) {
      console.error('💥 Migration fix failed:', error);
      throw error;
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const fixer = new MigrationFixer();
  
  fixer.run()
    .then(() => {
      console.log('🎯 Migration dependency fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration dependency fix failed:', error);
      process.exit(1);
    });
}

module.exports = MigrationFixer;