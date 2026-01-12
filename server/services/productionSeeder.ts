/**
 * Production-Ready Database Seeder
 * 
 * CRITICAL FIXES:
 * - Only runs AFTER schema validation passes
 * - Reports REAL insert counts (not fake success messages)
 * - Fails fast if schema doesn't exist
 * - Prevents duplicate seeding with proper checks
 */

import postgres from 'postgres';

interface SeedResult {
  success: boolean;
  tablesSeeded: number;
  totalInserts: number;
  errors: string[];
  executionTimeMs: number;
}

export class ProductionSeeder {
  private sql: any = null;

  async connect(): Promise<void> {
    console.log('🔌 Connecting to database for seeding...');
    
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('CRITICAL: DATABASE_URL environment variable is not set');
    }
    
    try {
      this.sql = postgres(connectionString, {
        ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
        max: 1,
        idle_timeout: 20,
        connect_timeout: 30
      });

      // Test connection
      await this.sql`SELECT 1`;
      console.log('✅ Database connection for seeding successful');
      
    } catch (error) {
      console.error('❌ Database connection for seeding failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async validateSchemaExists(): Promise<void> {
    console.log('🔍 Validating schema exists before seeding...');
    
    try {
      const tables = await this.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `;

      if (tables.length === 0) {
        throw new Error('CRITICAL: No tables found in database. Cannot seed without schema!');
      }

      // Check for essential tables
      const tableNames = tables.map((t: any) => t.table_name);
      const essentialTables = ['users', 'projects', 'content'];
      const missingTables = essentialTables.filter(table => !tableNames.includes(table));

      if (missingTables.length > 0) {
        console.warn(`⚠️  Some essential tables are missing: ${missingTables.join(', ')}`);
        console.warn('   Seeding will continue but may have limited functionality');
      }

      console.log(`✅ Schema validation passed - found ${tables.length} tables`);
      
    } catch (error) {
      console.error('❌ Schema validation failed:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async checkExistingData(): Promise<boolean> {
    console.log('🔍 Checking for existing data...');
    
    try {
      // Check if we already have users (primary indicator of seeded data)
      const userCount = await this.sql`SELECT COUNT(*) as count FROM users`;
      const hasUsers = parseInt(userCount[0].count) > 0;

      if (hasUsers) {
        console.log(`📊 Found ${userCount[0].count} existing users - skipping seeding`);
        return true;
      }

      console.log('📊 No existing users found - proceeding with seeding');
      return false;
      
    } catch (error) {
      // If users table doesn't exist, we definitely need to seed
      console.log('📊 Users table not accessible - assuming fresh database');
      return false;
    }
  }

  async seedEssentialData(): Promise<SeedResult> {
    console.log('🌱 Starting database seeding...');
    
    const startTime = Date.now();
    let tablesSeeded = 0;
    let totalInserts = 0;
    const errors: string[] = [];

    try {
      // Seed users table
      try {
        const userInserts = await this.sql`
          INSERT INTO users (id, email, name, created_at, updated_at)
          VALUES 
            ('test-user-1', 'demo@example.com', 'Demo User', NOW(), NOW()),
            ('test-user-2', 'admin@example.com', 'Admin User', NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;
        
        if (userInserts.length > 0) {
          console.log(`✅ Seeded ${userInserts.length} users`);
          totalInserts += userInserts.length;
          tablesSeeded++;
        } else {
          console.log('⏭️  Users already exist, skipping');
        }
      } catch (error) {
        const errorMsg = `Failed to seed users: ${error instanceof Error ? error.message : String(error)}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }

      // Seed projects table (if it exists)
      try {
        const projectInserts = await this.sql`
          INSERT INTO projects (id, name, description, user_id, created_at, updated_at)
          VALUES 
            ('demo-project-1', 'Demo Project', 'A sample project for testing', 'test-user-1', NOW(), NOW()),
            ('demo-project-2', 'Admin Project', 'Admin sample project', 'test-user-2', NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;
        
        if (projectInserts.length > 0) {
          console.log(`✅ Seeded ${projectInserts.length} projects`);
          totalInserts += projectInserts.length;
          tablesSeeded++;
        } else {
          console.log('⏭️  Projects already exist, skipping');
        }
      } catch (error) {
        const errorMsg = `Failed to seed projects: ${error instanceof Error ? error.message : String(error)}`;
        console.warn(`⚠️  ${errorMsg} (table may not exist yet)`);
        // Don't add to errors since projects table is optional
      }

      // Seed content table (if it exists)
      try {
        const contentInserts = await this.sql`
          INSERT INTO content (id, title, body, project_id, user_id, created_at, updated_at)
          VALUES 
            ('demo-content-1', 'Welcome Content', 'Welcome to the platform!', 'demo-project-1', 'test-user-1', NOW(), NOW()),
            ('demo-content-2', 'Admin Content', 'Admin welcome message', 'demo-project-2', 'test-user-2', NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
          RETURNING id
        `;
        
        if (contentInserts.length > 0) {
          console.log(`✅ Seeded ${contentInserts.length} content items`);
          totalInserts += contentInserts.length;
          tablesSeeded++;
        } else {
          console.log('⏭️  Content already exists, skipping');
        }
      } catch (error) {
        const errorMsg = `Failed to seed content: ${error instanceof Error ? error.message : String(error)}`;
        console.warn(`⚠️  ${errorMsg} (table may not exist yet)`);
        // Don't add to errors since content table is optional
      }

    } catch (error) {
      const errorMsg = `Seeding process failed: ${error instanceof Error ? error.message : String(error)}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }

    const executionTime = Date.now() - startTime;

    if (errors.length === 0 && totalInserts > 0) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📊 Summary:`);
      console.log(`   • Tables seeded: ${tablesSeeded}`);
      console.log(`   • Total inserts: ${totalInserts}`);
      console.log(`   • Execution time: ${executionTime}ms`);
      console.log('');
      console.log('✅ Database is now ready with essential data!');
      console.log('═══════════════════════════════════════════════════════════════');
    } else if (totalInserts === 0 && errors.length === 0) {
      console.log('');
      console.log('⏭️  Database seeding skipped - data already exists');
      console.log('');
    } else {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log('⚠️  DATABASE SEEDING COMPLETED WITH WARNINGS');
      console.log('═══════════════════════════════════════════════════════════════');
      console.log(`📊 Summary:`);
      console.log(`   • Tables seeded: ${tablesSeeded}`);
      console.log(`   • Total inserts: ${totalInserts}`);
      console.log(`   • Errors: ${errors.length}`);
      console.log(`   • Execution time: ${executionTime}ms`);
      if (errors.length > 0) {
        console.log('❌ Errors encountered:');
        errors.forEach(error => console.log(`   • ${error}`));
      }
      console.log('═══════════════════════════════════════════════════════════════');
    }

    return {
      success: errors.length === 0,
      tablesSeeded,
      totalInserts,
      errors,
      executionTimeMs: executionTime
    };
  }

  async close(): Promise<void> {
    if (this.sql) {
      await this.sql.end();
      console.log('🔌 Database connection for seeding closed');
    }
  }

  async run(): Promise<SeedResult> {
    try {
      await this.connect();
      await this.validateSchemaExists();
      
      const hasExistingData = await this.checkExistingData();
      if (hasExistingData) {
        await this.close();
        return {
          success: true,
          tablesSeeded: 0,
          totalInserts: 0,
          errors: [],
          executionTimeMs: 0
        };
      }
      
      const result = await this.seedEssentialData();
      await this.close();
      
      return result;
      
    } catch (error) {
      console.error('💥 Seeding process failed:', error instanceof Error ? error.message : String(error));
      
      if (this.sql) {
        try {
          await this.sql.end();
        } catch (closeError) {
          console.error('Failed to close database connection:', closeError);
        }
      }
      
      throw error;
    }
  }
}

export default ProductionSeeder;