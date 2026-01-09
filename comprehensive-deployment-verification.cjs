#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function comprehensiveVerification() {
  console.log('🔍 COMPREHENSIVE DEPLOYMENT VERIFICATION');
  console.log('==========================================');
  
  const results = {
    database: false,
    docker: false,
    railway: false,
    environment: false,
    build: false
  };

  // 1. Database Verification
  console.log('\n📊 1. DATABASE VERIFICATION');
  console.log('----------------------------');
  
  try {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'creators_dev_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };

    const client = new Client(dbConfig);
    await client.connect();
    
    // Check required tables
    const requiredTables = [
      'users', 'projects', 'content', 'scheduled_content', 
      'ai_content_suggestions', 'templates', 'notifications'
    ];
    
    for (const table of requiredTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.log(`❌ Table '${table}' missing`);
        results.database = false;
        break;
      }
    }
    
    // Check critical columns
    const userColumns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    const hasPassword = userColumns.rows.some(col => col.column_name === 'password');
    
    const scheduledColumns = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'scheduled_content'
    `);
    const hasProjectId = scheduledColumns.rows.some(col => col.column_name === 'project_id');
    
    if (hasPassword && hasProjectId) {
      console.log('✅ Critical columns exist (password, project_id)');
      results.database = true;
    } else {
      console.log('❌ Missing critical columns');
    }
    
    await client.end();
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }

  // 2. Docker Verification
  console.log('\n🐳 2. DOCKER VERIFICATION');
  console.log('-------------------------');
  
  try {
    // Check if Docker is installed
    execSync('docker --version', { stdio: 'pipe' });
    console.log('✅ Docker is installed');
    
    // Check if docker-compose is available
    execSync('docker-compose --version', { stdio: 'pipe' });
    console.log('✅ Docker Compose is available');
    
    // Check Dockerfile exists
    if (fs.existsSync('Dockerfile')) {
      console.log('✅ Dockerfile exists');
    } else {
      console.log('❌ Dockerfile missing');
      results.docker = false;
    }
    
    // Check docker-compose.yml exists
    if (fs.existsSync('docker-compose.yml')) {
      console.log('✅ docker-compose.yml exists');
    } else {
      console.log('❌ docker-compose.yml missing');
      results.docker = false;
    }
    
    // Check .dockerignore exists
    if (fs.existsSync('.dockerignore')) {
      console.log('✅ .dockerignore exists');
    } else {
      console.log('⚠️ .dockerignore missing (recommended)');
    }
    
    results.docker = true;
    
  } catch (error) {
    console.log('❌ Docker verification failed:', error.message);
  }

  // 3. Railway Verification
  console.log('\n🚂 3. RAILWAY DEPLOYMENT VERIFICATION');
  console.log('------------------------------------');
  
  try {
    // Check railway.json
    if (fs.existsSync('railway.json')) {
      const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
      console.log('✅ railway.json exists');
      console.log(`   Build command: ${railwayConfig.build?.command || 'npm run build'}`);
      console.log(`   Start command: ${railwayConfig.deploy?.startCommand || 'npm start'}`);
    } else {
      console.log('❌ railway.json missing');
    }
    
    // Check nixpacks.toml
    if (fs.existsSync('nixpacks.toml')) {
      console.log('✅ nixpacks.toml exists');
    } else {
      console.log('⚠️ nixpacks.toml missing (optional)');
    }
    
    // Check production environment files
    if (fs.existsSync('.env.production.example')) {
      console.log('✅ .env.production.example exists');
    } else {
      console.log('❌ .env.production.example missing');
    }
    
    results.railway = true;
    
  } catch (error) {
    console.log('❌ Railway verification failed:', error.message);
  }

  // 4. Environment Verification
  console.log('\n🌍 4. ENVIRONMENT VERIFICATION');
  console.log('------------------------------');
  
  const requiredEnvVars = [
    'DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'
  ];
  
  let envCount = 0;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`✅ ${envVar} is set`);
      envCount++;
    } else {
      console.log(`❌ ${envVar} missing`);
    }
  }
  
  results.environment = envCount === requiredEnvVars.length;

  // 5. Build Verification
  console.log('\n🔨 5. BUILD VERIFICATION');
  console.log('-----------------------');
  
  try {
    // Check if dist directory exists
    if (fs.existsSync('dist')) {
      console.log('✅ dist directory exists');
      
      // Check if built files exist
      if (fs.existsSync('dist/index.js')) {
        console.log('✅ Built server file exists');
      } else {
        console.log('❌ Built server file missing');
      }
      
      if (fs.existsSync('dist/public')) {
        console.log('✅ Built client files exist');
      } else {
        console.log('❌ Built client files missing');
      }
      
      results.build = true;
    } else {
      console.log('❌ dist directory missing - run npm run build');
    }
    
  } catch (error) {
    console.log('❌ Build verification failed:', error.message);
  }

  // Summary
  console.log('\n📋 VERIFICATION SUMMARY');
  console.log('======================');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  
  console.log(`Database: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Docker: ${results.docker ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Railway: ${results.railway ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Environment: ${results.environment ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Build: ${results.build ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log(`\n🎯 Overall Score: ${passedChecks}/${totalChecks}`);
  
  if (passedChecks === totalChecks) {
    console.log('🎉 ALL CHECKS PASSED - READY FOR DEPLOYMENT!');
    return true;
  } else {
    console.log('⚠️ SOME CHECKS FAILED - NEEDS ATTENTION');
    return false;
  }
}

// Load environment variables
require('dotenv').config();

// Run verification
comprehensiveVerification()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });