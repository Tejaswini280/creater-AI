#!/usr/bin/env node

/**
 * Database Reset Script
 * Provides clean, migrate, and seed operations
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { migrate } = require('drizzle-orm/postgres-js/migrator');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Parse command
const command = process.argv[2] || 'all';

async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  
  const sql = postgres(DATABASE_URL, { max: 1 });
  
  try {
    // Drop all tables in the public schema
    await sql`
      DO $$ 
      DECLARE
        r RECORD;
      BEGIN
        -- Drop all tables
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
        LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
        
        -- Drop all sequences
        FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public')
        LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
        END LOOP;
        
        -- Drop all views
        FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public')
        LOOP
          EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
        END LOOP;
      END $$;
    `;
    
    console.log('✅ Database cleaned successfully');
    console.log('   - All tables dropped');
    console.log('   - All sequences dropped');
    console.log('   - All views dropped');
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

async function runMigrations() {
  console.log('🔄 Running migrations...');
  
  const sql = postgres(DATABASE_URL, { max: 1 });
  const db = drizzle(sql);
  
  try {
    const migrationsFolder = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsFolder)) {
      console.error('❌ Migrations folder not found:', migrationsFolder);
      process.exit(1);
    }
    
    // Run migrations using drizzle-orm
    await migrate(db, { migrationsFolder });
    
    console.log('✅ Migrations completed successfully');
    
    // List applied migrations
    const migrations = fs.readdirSync(migrationsFolder)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`   - Applied ${migrations.length} migrations`);
    migrations.slice(0, 5).forEach(m => console.log(`     • ${m}`));
    if (migrations.length > 5) {
      console.log(`     ... and ${migrations.length - 5} more`);
    }
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  const sql = postgres(DATABASE_URL, { max: 1 });
  
  try {
    // Create test user
    const [user] = await sql`
      INSERT INTO users (
        id, 
        username, 
        email, 
        full_name,
        created_at,
        updated_at
      ) VALUES (
        'test-user-' || gen_random_uuid()::text,
        'testuser',
        'test@example.com',
        'Test User',
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO UPDATE 
      SET username = EXCLUDED.username
      RETURNING *
    `;
    
    console.log('✅ Test user created:', user.email);
    
    // Create test project
    const [project] = await sql`
      INSERT INTO projects (
        id,
        user_id,
        name,
        description,
        platform,
        niche,
        target_audience,
        content_pillars,
        posting_frequency,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        ${user.id},
        'Sample Project',
        'A sample project for testing',
        'youtube',
        'Technology',
        'Tech enthusiasts and developers',
        ARRAY['Tutorials', 'Reviews', 'News'],
        'daily',
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    console.log('✅ Test project created:', project.name);
    
    // Create sample content
    await sql`
      INSERT INTO content (
        id,
        user_id,
        project_id,
        title,
        description,
        content_type,
        platform,
        status,
        created_at,
        updated_at
      ) VALUES 
      (
        gen_random_uuid(),
        ${user.id},
        ${project.id},
        'Getting Started with AI',
        'An introduction to artificial intelligence',
        'video',
        'youtube',
        'draft',
        NOW(),
        NOW()
      ),
      (
        gen_random_uuid(),
        ${user.id},
        ${project.id},
        'Top 10 Tech Trends 2025',
        'Exploring the latest technology trends',
        'video',
        'youtube',
        'published',
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Sample content created');
    
    // Create analytics data
    await sql`
      INSERT INTO analytics (
        id,
        user_id,
        project_id,
        metric_type,
        metric_value,
        date,
        created_at
      ) VALUES
      (
        gen_random_uuid(),
        ${user.id},
        ${project.id},
        'views',
        1500,
        CURRENT_DATE - INTERVAL '1 day',
        NOW()
      ),
      (
        gen_random_uuid(),
        ${user.id},
        ${project.id},
        'engagement',
        85,
        CURRENT_DATE - INTERVAL '1 day',
        NOW()
      )
    `;
    
    console.log('✅ Analytics data created');
    
    // Create scheduled content
    await sql`
      INSERT INTO scheduled_content (
        id,
        user_id,
        project_id,
        title,
        scheduled_time,
        platform,
        status,
        created_at,
        updated_at
      ) VALUES
      (
        gen_random_uuid(),
        ${user.id},
        ${project.id},
        'Upcoming Video Release',
        NOW() + INTERVAL '2 days',
        'youtube',
        'scheduled',
        NOW(),
        NOW()
      )
    `;
    
    console.log('✅ Scheduled content created');
    
    console.log('');
    console.log('📊 Database seeded with:');
    console.log('   - 1 test user (test@example.com)');
    console.log('   - 1 sample project');
    console.log('   - 2 content items');
    console.log('   - 2 analytics records');
    console.log('   - 1 scheduled content');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

async function resetAll() {
  console.log('🔄 Starting complete database reset...\n');
  
  try {
    await cleanDatabase();
    console.log('');
    await runMigrations();
    console.log('');
    await seedDatabase();
    console.log('');
    console.log('✅ Database reset completed successfully!');
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  }
}

// Execute command
(async () => {
  try {
    switch (command) {
      case 'clean':
        await cleanDatabase();
        break;
      case 'migrate':
        await runMigrations();
        break;
      case 'seed':
        await seedDatabase();
        break;
      case 'all':
        await resetAll();
        break;
      default:
        console.error('❌ Invalid command. Use: clean, migrate, seed, or all');
        process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
})();
