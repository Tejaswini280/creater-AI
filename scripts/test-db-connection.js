#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests database connectivity using the configured environment variables
 */

import postgres from 'postgres';

// Build connection string from environment variables (same logic as server/db.ts)
const buildConnectionString = () => {
  // If DATABASE_URL is provided, use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Otherwise, build from individual environment variables
  const dbName = process.env.DB_NAME || "creators_dev_db";
  const dbUser = process.env.DB_USER || "creators_dev_user";
  const dbPassword = process.env.DB_PASSWORD || "CreatorsDev54321";
  const dbHost = process.env.DB_HOST || "db";
  const dbPort = process.env.DB_PORT || "5432";

  return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
};

async function testConnection() {
  const connectionString = buildConnectionString();

  console.log('🔍 Testing database connection...');
  console.log(`📍 Connection: ${connectionString.replace(/\/\/.*@/, '//***:***@')}`);

  try {
    // Create a connection with a short timeout for testing
    const client = postgres(connectionString, {
      max: 1,
      idle_timeout: 5,
      connect_timeout: 10,
    });

    // Test the connection
    const result = await client`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    console.log(`📊 Test query result: ${JSON.stringify(result[0])}`);

    // Close the connection
    await client.end();
    console.log('🔌 Connection closed successfully');

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);

    // Provide helpful troubleshooting information
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   - Ensure the database server is running');
    console.log('   - Check that the database credentials are correct');
    console.log('   - Verify network connectivity to the database host');
    console.log('   - Make sure the database exists and is accessible');

    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error during database test:', error);
    process.exit(1);
  });
