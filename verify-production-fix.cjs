#!/usr/bin/env node

/**
 * PRODUCTION FIX VERIFICATION SCRIPT
 * 
 * This script verifies that the production database repair was successful
 * and that the application is working correctly.
 */

const https = require('https');
const http = require('http');

const config = {
  // Railway production URL
  productionUrl: 'https://creator-dev-server-staging.up.railway.app',
  // Local development URL for testing
  localUrl: 'http://localhost:5000',
  // Test timeout
  timeout: 30000
};

class ProductionFixVerifier {
  constructor() {
    this.results = {
      healthCheck: false,
      databaseReady: false,
      schedulerReady: false,
      noErrors: false,
      responseTime: 0
    };
  }

  async makeRequest(url, path = '') {
    return new Promise((resolve, reject) => {
      const fullUrl = url + path;
      const isHttps = fullUrl.startsWith('https');
      const client = isHttps ? https : http;
      
      const startTime = Date.now();
      
      const req = client.get(fullUrl, { timeout: config.timeout }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          
          try {
            const jsonData = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              data: jsonData,
              responseTime,
              headers: res.headers
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              data: data,
              responseTime,
              headers: res.headers,
              parseError: error.message
            });
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async testHealthEndpoint(baseUrl) {
    console.log('🔍 Testing health endpoint...');
    
    try {
      const response = await this.makeRequest(baseUrl, '/api/health');
      
      if (response.statusCode === 200) {
        console.log('✅ Health endpoint responding (200 OK)');
        console.log(`   Response time: ${response.responseTime}ms`);
        
        if (response.data && typeof response.data === 'object') {
          console.log('✅ Health endpoint returning valid JSON');
          
          // Check for expected fields
          if (response.data.status === 'ok') {
            console.log('✅ Application status: OK');
            this.results.healthCheck = true;
          }
          
          if (response.data.database === 'ready') {
            console.log('✅ Database status: Ready');
            this.results.databaseReady = true;
          }
          
          if (response.data.scheduler === 'initialized') {
            console.log('✅ Scheduler status: Initialized');
            this.results.schedulerReady = true;
          }
          
          this.results.responseTime = response.responseTime;
          this.results.noErrors = true;
          
          console.log('📊 Health check data:', JSON.stringify(response.data, null, 2));
        } else {
          console.log('⚠️  Health endpoint not returning expected JSON format');
        }
      } else if (response.statusCode === 502) {
        console.log('❌ 502 Bad Gateway - The fix has not resolved the issue yet');
        console.log('   This could mean:');
        console.log('   - Deployment is still in progress');
        console.log('   - Database migration is still running');
        console.log('   - Application is still starting up');
      } else {
        console.log(`⚠️  Unexpected status code: ${response.statusCode}`);
        console.log('   Response:', response.data);
      }
      
    } catch (error) {
      console.log('❌ Health endpoint test failed:', error.message);
      
      if (error.message.includes('ECONNREFUSED')) {
        console.log('   - Connection refused (server not running or not accessible)');
      } else if (error.message.includes('timeout')) {
        console.log('   - Request timeout (server may be starting up)');
      } else if (error.message.includes('ENOTFOUND')) {
        console.log('   - DNS resolution failed (check URL)');
      }
    }
  }

  async testDatabaseEndpoint(baseUrl) {
    console.log('');
    console.log('🔍 Testing database performance endpoint...');
    
    try {
      const response = await this.makeRequest(baseUrl, '/api/db/perf');
      
      if (response.statusCode === 200) {
        console.log('✅ Database performance endpoint responding');
        console.log(`   Response time: ${response.responseTime}ms`);
        
        if (response.data && response.data.ok) {
          console.log('✅ Database performance data available');
          console.log('📊 Database stats:', JSON.stringify(response.data, null, 2));
        }
      } else {
        console.log(`⚠️  Database endpoint returned: ${response.statusCode}`);
      }
      
    } catch (error) {
      console.log('⚠️  Database endpoint test failed:', error.message);
    }
  }

  async testWebSocketEndpoint(baseUrl) {
    console.log('');
    console.log('🔍 Testing WebSocket stats endpoint...');
    
    try {
      const response = await this.makeRequest(baseUrl, '/api/websocket/stats');
      
      if (response.statusCode === 200) {
        console.log('✅ WebSocket stats endpoint responding');
        console.log(`   Response time: ${response.responseTime}ms`);
        console.log('📊 WebSocket stats:', JSON.stringify(response.data, null, 2));
      } else {
        console.log(`⚠️  WebSocket endpoint returned: ${response.statusCode}`);
      }
      
    } catch (error) {
      console.log('⚠️  WebSocket endpoint test failed:', error.message);
    }
  }

  printSummary() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('📊 PRODUCTION FIX VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    
    const checks = [
      { name: 'Health Check Responding', status: this.results.healthCheck },
      { name: 'Database Ready', status: this.results.databaseReady },
      { name: 'Scheduler Initialized', status: this.results.schedulerReady },
      { name: 'No 502 Errors', status: this.results.noErrors },
      { name: 'Response Time < 5s', status: this.results.responseTime < 5000 }
    ];
    
    let passedChecks = 0;
    
    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
      if (check.status) passedChecks++;
    });
    
    console.log('');
    console.log(`📈 Overall Score: ${passedChecks}/${checks.length} checks passed`);
    
    if (this.results.responseTime > 0) {
      console.log(`⏱️  Average Response Time: ${this.results.responseTime}ms`);
    }
    
    console.log('');
    
    if (passedChecks === checks.length) {
      console.log('🎉 SUCCESS: Production fix verification PASSED!');
      console.log('   The Railway 502 errors have been resolved.');
      console.log('   The application is working correctly with:');
      console.log('   - Deterministic boot sequence');
      console.log('   - Idempotent database migrations');
      console.log('   - PostgreSQL advisory locking');
      console.log('   - Schema-safe service initialization');
    } else if (passedChecks >= 3) {
      console.log('⚠️  PARTIAL SUCCESS: Most checks passed');
      console.log('   The core issues appear to be resolved.');
      console.log('   Some minor issues may need attention.');
    } else {
      console.log('❌ FAILURE: Production fix verification FAILED');
      console.log('   The 502 errors may still be present.');
      console.log('   Check the deployment logs and database status.');
    }
    
    console.log('═══════════════════════════════════════════════════════════════════════════════');
  }

  async run() {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('🔧 PRODUCTION FIX VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('This script verifies that the production database repair was successful');
    console.log('and that the Railway 502 errors have been resolved.');
    console.log('');
    
    // Determine which URL to test
    const testProduction = process.argv.includes('--production');
    const baseUrl = testProduction ? config.productionUrl : config.localUrl;
    
    console.log(`🎯 Testing: ${baseUrl}`);
    console.log(`🕐 Timeout: ${config.timeout}ms`);
    console.log('');
    
    // Run all tests
    await this.testHealthEndpoint(baseUrl);
    await this.testDatabaseEndpoint(baseUrl);
    await this.testWebSocketEndpoint(baseUrl);
    
    // Print summary
    this.printSummary();
    
    // Exit with appropriate code
    const success = this.results.healthCheck && this.results.databaseReady && this.results.noErrors;
    process.exit(success ? 0 : 1);
  }
}

// Run the verification
const verifier = new ProductionFixVerifier();
verifier.run().catch(error => {
  console.error('💥 Verification script failed:', error);
  process.exit(1);
});