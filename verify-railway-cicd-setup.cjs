#!/usr/bin/env node

/**
 * Railway CI/CD Setup Verification Script
 * 
 * This script verifies that all components are properly configured
 * for Railway CI/CD deployments via GitHub Actions.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${description}: ${filePath}`, 'green');
    return true;
  } else {
    log(`❌ ${description} not found: ${filePath}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, checks, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ ${description} not found: ${filePath}`, 'red');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let allPassed = true;

  checks.forEach(({ pattern, message }) => {
    if (content.includes(pattern)) {
      log(`  ✅ ${message}`, 'green');
    } else {
      log(`  ❌ ${message}`, 'red');
      allPassed = false;
    }
  });

  return allPassed;
}

async function main() {
  log('\n🔍 Railway CI/CD Setup Verification\n', 'cyan');
  log('=' .repeat(60), 'blue');

  let allChecks = true;

  // Check 1: Migration file
  log('\n📋 Checking Migration File...', 'yellow');
  const migrationChecks = [
    { pattern: 'ALTER TABLE content ADD COLUMN IF NOT EXISTS day_number', message: 'day_number column added' },
    { pattern: 'ALTER TABLE content ADD COLUMN IF NOT EXISTS is_paused', message: 'is_paused column added' },
    { pattern: 'ALTER TABLE content ADD COLUMN IF NOT EXISTS is_stopped', message: 'is_stopped column added' },
    { pattern: 'ALTER TABLE content ADD COLUMN IF NOT EXISTS can_publish', message: 'can_publish column added' },
    { pattern: 'COMMENT ON COLUMN content.day_number', message: 'Comments added after columns' },
  ];
  allChecks = checkFileContent(
    'migrations/0003_additional_tables_safe.sql',
    migrationChecks,
    'Migration file'
  ) && allChecks;

  // Check 2: Staging workflow
  log('\n📋 Checking Staging Workflow...', 'yellow');
  const stagingChecks = [
    { pattern: 'ghcr.io/railwayapp/cli:latest', message: 'Using Railway CLI Docker image' },
    { pattern: 'railway login --browserless', message: 'Browserless authentication configured' },
    { pattern: 'railway up', message: 'Railway up command present' },
    { pattern: '--service', message: 'Service flag present' },
    { pattern: '--detach', message: 'Detached deployment configured' },
    { pattern: 'RAILWAY_TOKEN', message: 'Railway token secret referenced' },
    { pattern: 'RAILWAY_STAGING_SERVICE_NAME', message: 'Staging service name secret referenced' },
  ];
  allChecks = checkFileContent(
    '.github/workflows/staging-deploy.yml',
    stagingChecks,
    'Staging workflow'
  ) && allChecks;

  // Check 3: Production workflow
  log('\n📋 Checking Production Workflow...', 'yellow');
  const productionChecks = [
    { pattern: 'ghcr.io/railwayapp/cli:latest', message: 'Using Railway CLI Docker image' },
    { pattern: 'railway login --browserless', message: 'Browserless authentication configured' },
    { pattern: 'railway link', message: 'Service linking configured' },
    { pattern: 'railway up', message: 'Railway up command present' },
    { pattern: '--detach', message: 'Detached deployment configured' },
    { pattern: 'RAILWAY_TOKEN', message: 'Railway token secret referenced' },
    { pattern: 'RAILWAY_PROD_SERVICE_ID', message: 'Production service ID secret referenced' },
    { pattern: 'health', message: 'Health check verification present' },
  ];
  allChecks = checkFileContent(
    '.github/workflows/production-deploy.yml',
    productionChecks,
    'Production workflow'
  ) && allChecks;

  // Check 4: Railway configuration
  log('\n📋 Checking Railway Configuration...', 'yellow');
  allChecks = checkFileExists('railway.json', 'Railway config') && allChecks;
  
  if (fs.existsSync('railway.json')) {
    const railwayConfig = JSON.parse(fs.readFileSync('railway.json', 'utf8'));
    
    if (railwayConfig.deploy?.startCommand) {
      log('  ✅ Start command configured', 'green');
    } else {
      log('  ❌ Start command not configured', 'red');
      allChecks = false;
    }
    
    if (railwayConfig.deploy?.healthcheckPath) {
      log('  ✅ Health check path configured', 'green');
    } else {
      log('  ❌ Health check path not configured', 'red');
      allChecks = false;
    }
    
    if (railwayConfig.deploy?.restartPolicyType) {
      log('  ✅ Restart policy configured', 'green');
    } else {
      log('  ❌ Restart policy not configured', 'red');
      allChecks = false;
    }
  }

  // Check 5: Nixpacks configuration
  log('\n📋 Checking Nixpacks Configuration...', 'yellow');
  const nixpacksChecks = [
    { pattern: 'nodejs_20', message: 'Node.js 20 configured' },
    { pattern: 'npm ci', message: 'npm ci install command' },
    { pattern: 'npm run railway:build', message: 'Railway build command' },
    { pattern: 'npm run start', message: 'Start command' },
  ];
  allChecks = checkFileContent(
    'nixpacks.toml',
    nixpacksChecks,
    'Nixpacks config'
  ) && allChecks;

  // Check 6: Package.json scripts
  log('\n📋 Checking Package.json Scripts...', 'yellow');
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (pkg.scripts?.start) {
      log('  ✅ start script present', 'green');
    } else {
      log('  ❌ start script missing', 'red');
      allChecks = false;
    }
    
    if (pkg.scripts?.['railway:build']) {
      log('  ✅ railway:build script present', 'green');
    } else {
      log('  ❌ railway:build script missing', 'red');
      allChecks = false;
    }
    
    if (pkg.scripts?.build) {
      log('  ✅ build script present', 'green');
    } else {
      log('  ❌ build script missing', 'red');
      allChecks = false;
    }
  } else {
    log('  ❌ package.json not found', 'red');
    allChecks = false;
  }

  // Check 7: Documentation
  log('\n📋 Checking Documentation...', 'yellow');
  allChecks = checkFileExists('RAILWAY_CICD_SECRETS_SETUP.md', 'Secrets setup guide') && allChecks;
  allChecks = checkFileExists('RAILWAY_CICD_DEPLOYMENT_GUIDE.md', 'Deployment guide') && allChecks;

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  if (allChecks) {
    log('\n✅ All checks passed! Railway CI/CD is properly configured.', 'green');
    log('\n📝 Next steps:', 'cyan');
    log('  1. Configure GitHub Secrets (see RAILWAY_CICD_SECRETS_SETUP.md)', 'cyan');
    log('  2. Push to dev branch to test staging deployment', 'cyan');
    log('  3. Push to main branch to test production deployment', 'cyan');
    log('  4. Monitor deployments in Railway dashboard\n', 'cyan');
    process.exit(0);
  } else {
    log('\n❌ Some checks failed. Please fix the issues above.', 'red');
    log('\n📝 Common fixes:', 'yellow');
    log('  - Ensure all workflow files are updated', 'yellow');
    log('  - Verify railway.json and nixpacks.toml exist', 'yellow');
    log('  - Check migration file has columns before comments', 'yellow');
    log('  - Review documentation files are present\n', 'yellow');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
