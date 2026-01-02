#!/usr/bin/env node

/**
 * Environment Loader Script
 * This script helps load the appropriate .env file based on NODE_ENV
 */

import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';
import { join } from 'path';

// Determine which environment file to load
const nodeEnv = process.env.NODE_ENV || 'development';
const envFile = `.env.${nodeEnv}`;

console.log(`Loading environment: ${nodeEnv}`);
console.log(`Looking for file: ${envFile}`);

// Check if the specific environment file exists
if (existsSync(envFile)) {
  console.log(`✅ Found environment file: ${envFile}`);
  const result = config({ path: envFile });
  if (result.error) {
    console.error('❌ Error loading environment file:', result.error);
  } else {
    console.log(`✅ Successfully loaded ${envFile}`);
  }
} else {
  console.log(`❌ Environment file ${envFile} not found, falling back to .env`);
  // Try to load default .env file
  if (existsSync('.env')) {
    console.log(`✅ Found default .env file`);
    const result = config();
    if (result.error) {
      console.error('❌ Error loading default .env file:', result.error);
    } else {
      console.log(`✅ Successfully loaded default .env`);
    }
  } else {
    console.log('⚠️  No .env file found, using system environment variables');
  }
}

// Display loaded database configuration (without sensitive data)
console.log('Database Configuration:');
console.log(`  DB_NAME: ${process.env.DB_NAME || 'creators_dev_db'}`);
console.log(`  DB_USER: ${process.env.DB_USER || 'creators_dev_user'}`);
console.log(`  DB_HOST: ${process.env.DB_HOST || 'db'}`);
console.log(`  DB_PORT: ${process.env.DB_PORT || '5432'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '[SET]' : 'postgresql://postgres:CreatorsDev54321@localhost:5432/creators_dev_db'}`);
console.log(`  S3_BUCKET: ${process.env.S3_BUCKET || 'ap-south-1'}`);
console.log(`  S3_REGION: ${process.env.S3_REGION || 'creators-dev'}`);
