/**
 * Production-Safe Admin User Seed Script
 * 
 * This script seeds the database with admin and testing users
 * Safe to run multiple times (idempotent)
 * 
 * Usage:
 *   node scripts/seed-admin-users.cjs
 *   
 * Or with Railway:
 *   railway run node scripts/seed-admin-users.cjs
 */

const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const bcrypt = require('bcrypt');

// Admin user credentials
const ADMIN_USER = {
  id: 'admin-tejaswini-primary',
  email: 'tejaswini.kawade@renaissa.ai',
  password: 'Intern2025#',
  firstName: 'Tejaswini',
  lastName: 'Kawade',
  role: 'admin'
};

// Testing user credentials
const TESTER_USER = {
  id: 'tester-renaissa-01',
  email: 'tester@renaissa.ai',
  password: 'Intern2025#',
  firstName: 'Test',
  lastName: 'User',
  role: 'tester'
};

async function seedAdminUsers() {
  console.log('🌱 Starting admin user seed process...');
  console.log('');
  
  // Get database connection string
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL environment variable not set');
    console.error('');
    console.error('Please set DATABASE_URL or run with Railway:');
    console.error('  railway run node scripts/seed-admin-users.cjs');
    process.exit(1);
  }
  
  console.log('✅ Database connection string found');
  console.log('');
  
  // Create database connection
  let client;
  try {
    client = postgres(connectionString, {
      max: 1,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false
    });
    
    console.log('✅ Connected to database');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error.message);
    process.exit(1);
  }
  
  try {
    // Hash the password (12 rounds - production standard)
    console.log('🔐 Hashing passwords with bcrypt (12 rounds)...');
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 12);
    console.log('✅ Password hashed successfully');
    console.log('');
    
    // Seed admin user
    console.log('👤 Seeding admin user...');
    console.log(`   Email: ${ADMIN_USER.email}`);
    console.log(`   Role: ${ADMIN_USER.role}`);
    
    const adminResult = await client`
      INSERT INTO users (
        id,
        email,
        password,
        first_name,
        last_name,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${ADMIN_USER.id},
        ${ADMIN_USER.email},
        ${hashedPassword},
        ${ADMIN_USER.firstName},
        ${ADMIN_USER.lastName},
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `;
    
    if (adminResult.length > 0) {
      console.log('✅ Admin user created successfully');
      console.log(`   ID: ${adminResult[0].id}`);
    } else {
      console.log('ℹ️  Admin user already exists (skipped)');
    }
    console.log('');
    
    // Seed testing user
    console.log('👤 Seeding testing user...');
    console.log(`   Email: ${TESTER_USER.email}`);
    console.log(`   Role: ${TESTER_USER.role}`);
    
    const testerResult = await client`
      INSERT INTO users (
        id,
        email,
        password,
        first_name,
        last_name,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        ${TESTER_USER.id},
        ${TESTER_USER.email},
        ${hashedPassword},
        ${TESTER_USER.firstName},
        ${TESTER_USER.lastName},
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `;
    
    if (testerResult.length > 0) {
      console.log('✅ Testing user created successfully');
      console.log(`   ID: ${testerResult[0].id}`);
    } else {
      console.log('ℹ️  Testing user already exists (skipped)');
    }
    console.log('');
    
    // Verify users exist
    console.log('🔍 Verifying seeded users...');
    const verifyResult = await client`
      SELECT id, email, first_name, last_name, is_active, created_at
      FROM users
      WHERE email IN (${ADMIN_USER.email}, ${TESTER_USER.email})
      ORDER BY email
    `;
    
    console.log('');
    console.log('📋 Seeded Users:');
    console.log('================');
    verifyResult.forEach(user => {
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Active: ${user.is_active}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('   ---');
    });
    console.log('');
    
    // Test login credentials
    console.log('🔐 Testing login credentials...');
    const testUser = await client`
      SELECT id, email, password, first_name, last_name
      FROM users
      WHERE email = ${ADMIN_USER.email}
      LIMIT 1
    `;
    
    if (testUser.length > 0) {
      const isPasswordValid = await bcrypt.compare(ADMIN_USER.password, testUser[0].password);
      if (isPasswordValid) {
        console.log('✅ Password verification PASSED');
        console.log('✅ Admin user can login immediately');
      } else {
        console.log('❌ Password verification FAILED');
        console.log('⚠️  There may be an issue with password hashing');
      }
    }
    console.log('');
    
    console.log('========================================');
    console.log('  ✅ Seed Process Completed Successfully!');
    console.log('========================================');
    console.log('');
    console.log('Login Credentials:');
    console.log('------------------');
    console.log(`Admin Email: ${ADMIN_USER.email}`);
    console.log(`Admin Password: ${ADMIN_USER.password}`);
    console.log('');
    console.log(`Tester Email: ${TESTER_USER.email}`);
    console.log(`Tester Password: ${TESTER_USER.password}`);
    console.log('');
    console.log('You can now login via:');
    console.log('  POST /api/auth/login');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Seed process failed:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close database connection
    if (client) {
      await client.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the seed function
seedAdminUsers().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
