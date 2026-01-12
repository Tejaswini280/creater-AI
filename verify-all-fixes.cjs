#!/usr/bin/env node

/**
 * COMPREHENSIVE VERIFICATION SCRIPT
 * 
 * This script verifies that all root cause issues have been resolved:
 * 1. Database connection and schema
 * 2. Migration system
 * 3. Authentication setup
 * 4. Application configuration
 * 5. Docker readiness
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

console.log('🔍 COMPREHENSIVE VERIFICATION STARTING...');
console.log('═══════════════════════════════════════════════════════════════');

async function main() {
  const results = {
    database: false,
    schema: false,
    migrations: false,
    authentication: false,
    configuration: false,
    docker: false,
    overall: false
  };

  try {
    // Test 1: Database Connection
    console.log('\n📊 Test 1: Database Connection');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres123@localhost:5432/creators_dev_db'
    });
    
    const client = await pool.connect();
    const dbResult = await client.query('SELECT NOW() as time, current_database() as db, current_user as user');
    console.log(`✅ Database: ${dbResult.rows[0].db}`);
    console.log(`✅ User: ${dbResult.rows[0].user}`);
    console.log(`✅ Time: ${dbResult.rows[0].time}`);
    results.database = true;

    // Test 2: Schema Verification
    console.log('\n🗄️ Test 2: Database Schema');
    const essentialTables = [
      'users', 'projects', 'content', 'sessions', 
      'post_schedules', 'templates', 'hashtag_suggestions', 
      'ai_engagement_patterns', 'migration_history'
    ];

    let tablesExist = 0;
    for (const table of essentialTables) {
      const tableResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table]);
      
      if (tableResult.rows[0].exists) {
        console.log(`✅ Table exists: ${table}`);
        tablesExist++;
      } else {
        console.log(`❌ Table missing: ${table}`);
      }
    }
    
    results.schema = tablesExist === essentialTables.length;
    console.log(`📊 Schema status: ${tablesExist}/${essentialTables.length} tables exist`);

    // Test 3: Migration System
    console.log('\n🔄 Test 3: Migration System');
    try {
      const migrationResult = await client.query('SELECT COUNT(*) as count FROM migration_history');
      console.log(`✅ Migration tracking: ${migrationResult.rows[0].count} migrations recorded`);
      
      const migrationsDir = path.join(__dirname, 'migrations');
      if (fs.existsSync(migrationsDir)) {
        const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
        console.log(`✅ Migration files: ${migrationFiles.length} files found`);
        results.migrations = true;
      } else {
        console.log('⚠️ Migrations directory not found');
      }
    } catch (error) {
      console.log(`❌ Migration system error: ${error.message}`);
    }

    // Test 4: Authentication Setup
    console.log('\n🔐 Test 4: Authentication Setup');
    try {
      // Check users table structure
      const userColumns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('id', 'email', 'password', 'first_name', 'last_name')
      `);
      
      const requiredColumns = ['id', 'email', 'password', 'first_name', 'last_name'];
      const existingColumns = userColumns.rows.map(r => r.column_name);
      const hasAllColumns = requiredColumns.every(col => existingColumns.includes(col));
      
      if (hasAllColumns) {
        console.log('✅ Users table has all required auth columns');
      } else {
        console.log('❌ Users table missing auth columns');
      }

      // Check sessions table
      const sessionResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'sessions'
        )
      `);
      
      if (sessionResult.rows[0].exists) {
        console.log('✅ Sessions table exists');
      } else {
        console.log('❌ Sessions table missing');
      }

      // Check environment variables
      const jwtSecret = process.env.JWT_SECRET;
      const sessionSecret = process.env.SESSION_SECRET;
      
      if (jwtSecret && jwtSecret.length > 10) {
        console.log('✅ JWT_SECRET configured');
      } else {
        console.log('⚠️ JWT_SECRET not properly configured');
      }
      
      if (sessionSecret && sessionSecret.length > 10) {
        console.log('✅ SESSION_SECRET configured');
      } else {
        console.log('⚠️ SESSION_SECRET not properly configured');
      }

      results.authentication = hasAllColumns && sessionResult.rows[0].exists;
      
    } catch (error) {
      console.log(`❌ Authentication setup error: ${error.message}`);
    }

    client.release();
    await pool.end();

    // Test 5: Configuration Files
    console.log('\n⚙️ Test 5: Configuration Files');
    const configFiles = [
      { file: 'package.json', required: true },
      { file: '.env', required: true },
      { file: 'tsconfig.json', required: true },
      { file: 'vite.config.ts', required: true },
      { file: 'tailwind.config.ts', required: false },
      { file: 'server/index.ts', required: true }
    ];

    let configCount = 0;
    for (const { file, required } of configFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ Config file exists: ${file}`);
        configCount++;
      } else {
        console.log(`${required ? '❌' : '⚠️'} Config file ${required ? 'missing' : 'optional'}: ${file}`);
      }
    }
    
    const requiredConfigFiles = configFiles.filter(c => c.required).length;
    results.configuration = configCount >= requiredConfigFiles;
    console.log(`📊 Configuration: ${configCount}/${configFiles.length} files exist`);

    // Test 6: Docker Readiness
    console.log('\n🐳 Test 6: Docker Readiness');
    const dockerFiles = ['Dockerfile', 'docker-compose.yml', '.dockerignore'];
    let dockerCount = 0;
    
    for (const file of dockerFiles) {
      if (fs.existsSync(file)) {
        console.log(`✅ Docker file exists: ${file}`);
        dockerCount++;
      } else {
        console.log(`⚠️ Docker file missing: ${file}`);
      }
    }
    
    // Check if node_modules exists (for Docker build)
    if (fs.existsSync('node_modules')) {
      console.log('✅ Dependencies installed');
      dockerCount++;
    } else {
      console.log('⚠️ Dependencies not installed');
    }
    
    results.docker = dockerCount >= 3;
    console.log(`📊 Docker readiness: ${dockerCount}/4 requirements met`);

    // Overall Assessment
    console.log('\n📋 OVERALL ASSESSMENT');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const testResults = [
      { name: 'Database Connection', status: results.database },
      { name: 'Database Schema', status: results.schema },
      { name: 'Migration System', status: results.migrations },
      { name: 'Authentication Setup', status: results.authentication },
      { name: 'Configuration Files', status: results.configuration },
      { name: 'Docker Readiness', status: results.docker }
    ];

    let passedTests = 0;
    for (const test of testResults) {
      const icon = test.status ? '✅' : '❌';
      const status = test.status ? 'PASS' : 'FAIL';
      console.log(`${icon} ${test.name}: ${status}`);
      if (test.status) passedTests++;
    }

    results.overall = passedTests === testResults.length;
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`📊 Tests Passed: ${passedTests}/${testResults.length}`);
    
    if (results.overall) {
      console.log('🎉 ALL TESTS PASSED - APPLICATION IS READY!');
      console.log('');
      console.log('🚀 Next Steps:');
      console.log('   1. Start development: npm run dev');
      console.log('   2. Build for production: npm run build');
      console.log('   3. Start production: npm start');
      console.log('   4. Deploy to Railway: railway up');
      console.log('');
      console.log('🌐 Application URLs:');
      console.log('   - Frontend: http://localhost:3000');
      console.log('   - Backend API: http://localhost:5000');
      console.log('   - Health Check: http://localhost:5000/api/health');
    } else {
      console.log('⚠️ SOME TESTS FAILED - REVIEW ISSUES ABOVE');
      console.log('');
      console.log('🔧 Recommended Actions:');
      if (!results.database) console.log('   - Fix database connection');
      if (!results.schema) console.log('   - Run migration fix script');
      if (!results.migrations) console.log('   - Check migrations directory');
      if (!results.authentication) console.log('   - Verify auth configuration');
      if (!results.configuration) console.log('   - Check missing config files');
      if (!results.docker) console.log('   - Install dependencies and check Docker files');
    }

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error);
    console.log('═══════════════════════════════════════════════════════════════');
    process.exit(1);
  }
}

main().catch(console.error);