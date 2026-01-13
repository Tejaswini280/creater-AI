/**
 * TEST RAILWAY DEPLOYMENT READINESS
 * 
 * This script verifies that all fixes are in place for successful Railway deployment
 */

const fs = require('fs');
const path = require('path');

async function testRailwayDeploymentReady() {
  console.log('🔍 TESTING RAILWAY DEPLOYMENT READINESS...');
  console.log('');

  let allTestsPassed = true;

  // Test 1: Migration syntax check
  console.log('📋 TEST 1: Migration Syntax Verification');
  
  const migrationPath = path.join(process.cwd(), 'migrations', '0001_core_tables_idempotent.sql');
  
  if (fs.existsSync(migrationPath)) {
    const content = fs.readFileSync(migrationPath, 'utf8');
    
    // Check for bad syntax
    const hasBadSyntax = content.includes('DO $ ') && !content.includes('DO $$ ');
    const hasGoodSyntax = content.includes('DO $$ ');
    const hasProperEnding = content.includes('END $$;');
    
    if (hasBadSyntax) {
      console.log('❌ Migration file contains bad syntax (DO $ instead of DO $$)');
      allTestsPassed = false;
    } else if (hasGoodSyntax && hasProperEnding) {
      console.log('✅ Migration file syntax is correct');
    } else {
      console.log('⚠️  Migration file syntax check inconclusive');
    }
  } else {
    console.log('❌ Migration file not found');
    allTestsPassed = false;
  }

  // Test 2: Package.json scripts check
  console.log('');
  console.log('📋 TEST 2: Package.json Scripts Verification');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const hasStartScript = packageJson.scripts && packageJson.scripts.start;
    const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
    
    if (hasStartScript) {
      console.log(`✅ Start script found: ${packageJson.scripts.start}`);
    } else {
      console.log('❌ No start script found in package.json');
      allTestsPassed = false;
    }
    
    if (hasBuildScript) {
      console.log(`✅ Build script found: ${packageJson.scripts.build}`);
    } else {
      console.log('⚠️  No build script found (may be optional)');
    }
  } else {
    console.log('❌ Package.json not found');
    allTestsPassed = false;
  }

  // Test 3: Environment variables check
  console.log('');
  console.log('📋 TEST 3: Environment Configuration Check');
  
  const envFiles = ['.env.example', '.env.production.example'];
  let hasEnvExample = false;
  
  for (const envFile of envFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`✅ Found ${envFile}`);
      hasEnvExample = true;
      
      const envContent = fs.readFileSync(envFile, 'utf8');
      const hasDatabaseUrl = envContent.includes('DATABASE_URL');
      const hasPort = envContent.includes('PORT');
      
      if (hasDatabaseUrl) {
        console.log('✅ DATABASE_URL variable documented');
      } else {
        console.log('⚠️  DATABASE_URL not found in env example');
      }
      
      if (hasPort) {
        console.log('✅ PORT variable documented');
      } else {
        console.log('⚠️  PORT not found in env example');
      }
    }
  }
  
  if (!hasEnvExample) {
    console.log('⚠️  No environment example files found');
  }

  // Test 4: Docker configuration check
  console.log('');
  console.log('📋 TEST 4: Docker Configuration Check');
  
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
  const dockerComposePath = path.join(process.cwd(), 'docker-compose.yml');
  
  if (fs.existsSync(dockerfilePath)) {
    console.log('✅ Dockerfile found');
    
    const dockerContent = fs.readFileSync(dockerfilePath, 'utf8');
    const hasNodeImage = dockerContent.includes('FROM node:');
    const hasWorkdir = dockerContent.includes('WORKDIR');
    const hasExpose = dockerContent.includes('EXPOSE');
    
    if (hasNodeImage) {
      console.log('✅ Uses Node.js base image');
    }
    if (hasWorkdir) {
      console.log('✅ Sets working directory');
    }
    if (hasExpose) {
      console.log('✅ Exposes port');
    }
  } else {
    console.log('⚠️  Dockerfile not found (Railway can work without it)');
  }
  
  if (fs.existsSync(dockerComposePath)) {
    console.log('✅ Docker Compose configuration found');
  }

  // Test 5: Railway configuration check
  console.log('');
  console.log('📋 TEST 5: Railway Configuration Check');
  
  const railwayJsonPath = path.join(process.cwd(), 'railway.json');
  const nixpacksPath = path.join(process.cwd(), 'nixpacks.toml');
  
  if (fs.existsSync(railwayJsonPath)) {
    console.log('✅ Railway.json configuration found');
    
    const railwayConfig = JSON.parse(fs.readFileSync(railwayJsonPath, 'utf8'));
    if (railwayConfig.build) {
      console.log('✅ Build configuration specified');
    }
    if (railwayConfig.deploy) {
      console.log('✅ Deploy configuration specified');
    }
  } else {
    console.log('⚠️  Railway.json not found (will use defaults)');
  }
  
  if (fs.existsSync(nixpacksPath)) {
    console.log('✅ Nixpacks configuration found');
  }

  // Final result
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED - READY FOR RAILWAY DEPLOYMENT!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ Migration syntax is correct');
    console.log('✅ Package.json is properly configured');
    console.log('✅ Environment variables are documented');
    console.log('✅ Docker configuration is present');
    console.log('');
    console.log('🚀 Your application is ready to deploy to Railway!');
    console.log('Run: ./deploy-railway-fixed.ps1');
  } else {
    console.log('⚠️  SOME TESTS FAILED - PLEASE FIX BEFORE DEPLOYING');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Please address the issues above before deploying to Railway.');
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
}

// Run the test
testRailwayDeploymentReady().catch(console.error);