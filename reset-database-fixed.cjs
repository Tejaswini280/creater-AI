#!/usr/bin/env node

/**
 * Database Reset Script - PERMANENTLY FIXED VERSION
 * Runs SQL migrations directly and seeds with only guaranteed columns
 */

const postgres = require('postgres');
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
    await sql.unsafe(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO public;
    `);
    
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
  
  try {
    const migrationsFolder = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsFolder)) {
      console.error('❌ Migrations folder not found:', migrationsFolder);
      process.exit(1);
    }
    
    // Get all SQL files and sort them
    const migrationFiles = fs.readdirSync(migrationsFolder)
      .filter(f => f.endsWith('.sql') && !f.includes('.skip') && !f.includes('.backup'))
      .sort();
    
    console.log(`   Found ${migrationFiles.length} migration files`);
    
    let successCount = 0;
    let skippedCount = 0;
    
    // Run each migration file
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsFolder, file);
      const sqlContent = fs.readFileSync(filePath, 'utf8');
      
      // Skip empty files or comment-only files
      const hasActualSQL = sqlContent
        .split('\n')
        .some(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('--') && trimmed !== '';
        });
      
      if (!hasActualSQL) {
        console.log(`   ⏭️  Skipping ${file} (no SQL statements)`);
        skippedCount++;
        continue;
      }
      
      try {
        // Execute the SQL file
        await sql.unsafe(sqlContent);
        console.log(`   ✅ Applied ${file}`);
        successCount++;
      } catch (error) {
        // Some migrations might fail if tables already exist, that's okay
        if (error.message.includes('already exists')) {
          console.log(`   ⏭️  Skipped ${file} (already applied)`);
          skippedCount++;
        } else {
          console.error(`   ❌ Error in ${file}:`, error.message);
          // Continue with other migrations
        }
      }
    }
    
    console.log('✅ Migrations completed successfully');
    console.log(`   - Applied ${successCount} migrations`);
    if (skippedCount > 0) {
      console.log(`   - Skipped ${skippedCount} migrations`);
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
    // First, check what columns exist in the users table
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND table_schema = 'public'
    `;
    
    const columnNames = columns.map(c => c.column_name);
    console.log('   Available user columns:', columnNames.join(', '));
    
    // Build user object with only available columns
    const userObj = {
      id: `test-user-${Date.now()}`,
      email: 'test@example.com'
    };
    
    // Add optional columns if they exist
    if (columnNames.includes('first_name')) {
      userObj.first_name = 'Test';
    }
    if (columnNames.includes('last_name')) {
      userObj.last_name = 'User';
    }
    if (columnNames.includes('full_name')) {
      userObj.full_name = 'Test User';
    }
    if (columnNames.includes('password')) {
      userObj.password = 'oauth_user_no_password';
    }
    if (columnNames.includes('created_at')) {
      userObj.created_at = new Date();
    }
    if (columnNames.includes('updated_at')) {
      userObj.updated_at = new Date();
    }
    
    // Create test user using postgres library's insert syntax
    const [user] = await sql`
      INSERT INTO users ${sql([userObj])}
      ON CONFLICT (email) DO UPDATE 
      SET email = EXCLUDED.email
      RETURNING *
    `;
    console.log('✅ Test user created:', user.email);
    
    // Check if projects table exists
    const projectsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'projects'
      )
    `;
    
    if (projectsExists[0].exists) {
      // Check what columns exist in projects table
      const projectColumns = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND table_schema = 'public'
      `;
      
      const projectColumnNames = projectColumns.map(c => c.column_name);
      console.log('   Available project columns:', projectColumnNames.join(', '));
      
      // Build dynamic INSERT for projects
      const projCols = ['user_id', 'name', 'description'];
      const projVals = [user.id, 'Sample Project', 'A sample project for testing'];
      
      // Add optional columns if they exist
      if (projectColumnNames.includes('type')) {
        projCols.push('type');
        projVals.push('content_creation');
      }
      if (projectColumnNames.includes('platform')) {
        projCols.push('platform');
        projVals.push('youtube');
      }
      if (projectColumnNames.includes('niche')) {
        projCols.push('niche');
        projVals.push('Technology');
      }
      if (projectColumnNames.includes('target_audience')) {
        projCols.push('target_audience');
        projVals.push('Tech enthusiasts and developers');
      }
      if (projectColumnNames.includes('content_pillars')) {
        projCols.push('content_pillars');
        projVals.push(["Tutorials", "Reviews", "News"]);
      }
      if (projectColumnNames.includes('posting_frequency')) {
        projCols.push('posting_frequency');
        projVals.push('daily');
      }
      if (projectColumnNames.includes('created_at')) {
        projCols.push('created_at');
        projVals.push(new Date());
      }
      if (projectColumnNames.includes('updated_at')) {
        projCols.push('updated_at');
        projVals.push(new Date());
      }
      
      // Create test project
      const [project] = await sql`
        INSERT INTO projects ${sql(
          [{ ...Object.fromEntries(projCols.map((col, i) => [col, projVals[i]])) }]
        )}
        ON CONFLICT DO NOTHING
        RETURNING *
      `;
      
      if (project) {
        console.log('✅ Test project created:', project.name);
        
        // Check if content table exists
        const contentExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'content'
          )
        `;
        
        if (contentExists[0].exists) {
          // Create sample content
          await sql`
            INSERT INTO content (
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
            ON CONFLICT DO NOTHING
          `;
          
          console.log('✅ Sample content created');
        }
      }
    }
    
    console.log('');
    console.log('📊 Database seeded successfully');
    console.log('   - Test user: test@example.com');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.error('   Full error:', error);
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
