#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function testRailwayReadiness() {
  console.log('🚂 RAILWAY DEPLOYMENT READINESS CHECK');
  console.log('====================================');
  
  const checks = [];
  
  // 1. Check railway.json configuration
  console.log('\n📋 1. Railway Configuration');
  console.log('---------------------------');
  
  if (fs.existsSync('railway.json')) {
    const config = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
    console.log('✅ railway.json exists');
    console.log(`   Build: ${config.build?.command || 'npm run build'}`);
    console.log(`   Start: ${config.deploy?.startCommand || 'npm start'}`);
    checks.push(true);
  } else {
    console.log('❌ railway.json missing');
    checks.push(false);
  }
  
  // 2. Check environment files
  console.log('\n🌍 2. Environment Configuration');
  console.log('-------------------------------');
  
  const envFiles = ['.env.production.example', '.env.staging.example'];
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} exists`);
      checks.push(true);
    } else {
      console.log(`❌ ${file} missing`);
      checks.push(false);
    }
  });
  
  // 3. Check build output
  console.log('\n🔨 3. Build Output');
  console.log('------------------');
  
  if (fs.existsSync('dist/index.js')) {
    console.log('✅ Server build exists');
    checks.push(true);
  } else {
    console.log('❌ Server build missing');
    checks.push(false);
  }
  
  if (fs.existsSync('dist/public/index.html')) {
    console.log('✅ Client build exists');
    checks.push(true);
  } else {
    console.log('❌ Client build missing');
    checks.push(false);
  }
  
  // 4. Check package.json scripts
  console.log('\n📦 4. Package Scripts');
  console.log('--------------------');
  
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (pkg.scripts.build) {
    console.log('✅ Build script exists');
    checks.push(true);
  } else {
    console.log('❌ Build script missing');
    checks.push(false);
  }
  
  if (pkg.scripts.start) {
    console.log('✅ Start script exists');
    checks.push(true);
  } else {
    console.log('❌ Start script missing');
    checks.push(false);
  }
  
  // 5. Check database migrations
  console.log('\n🗄️ 5. Database Setup');
  console.log('--------------------');
  
  if (fs.existsSync('migrations') && fs.readdirSync('migrations').length > 0) {
    console.log('✅ Migration files exist');
    checks.push(true);
  } else {
    console.log('❌ Migration files missing');
    checks.push(false);
  }
  
  if (fs.existsSync('scripts/run-migrations.js')) {
    console.log('✅ Migration runner exists');
    checks.push(true);
  } else {
    console.log('❌ Migration runner missing');
    checks.push(false);
  }
  
  // 6. Check GitHub Actions (if exists)
  console.log('\n🔄 6. CI/CD Configuration');
  console.log('-------------------------');
  
  if (fs.existsSync('.github/workflows')) {
    const workflows = fs.readdirSync('.github/workflows');
    console.log(`✅ Found ${workflows.length} workflow(s)`);
    workflows.forEach(workflow => {
      console.log(`   - ${workflow}`);
    });
    checks.push(true);
  } else {
    console.log('⚠️ No GitHub workflows (optional)');
    checks.push(true); // Not required
  }
  
  // Summary
  console.log('\n📊 READINESS SUMMARY');
  console.log('===================');
  
  const passed = checks.filter(Boolean).length;
  const total = checks.length;
  
  console.log(`Score: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 READY FOR RAILWAY DEPLOYMENT!');
    console.log('\nNext steps:');
    console.log('1. Push to GitHub repository');
    console.log('2. Connect repository to Railway');
    console.log('3. Set environment variables in Railway dashboard');
    console.log('4. Deploy!');
    return true;
  } else {
    console.log('⚠️ Some issues need to be resolved before deployment');
    return false;
  }
}

testRailwayReadiness();