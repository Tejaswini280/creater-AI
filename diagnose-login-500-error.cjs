const { Client } = require('pg');

async function diagnoseLoginError() {
  console.log('🔍 DIAGNOSING LOGIN 500 ERROR\n');
  console.log('=' .repeat(60));
  
  // Use Railway staging database URL from the error
  const databaseUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ No database URL found. Please set RAILWAY_DATABASE_URL or DATABASE_URL');
    process.exit(1);
  }
  
  console.log('🔗 Connecting to:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('railway.app') ? { rejectUnauthorized: false } : undefined
  });

  try {
    await client.connect();
    console.log('✅ Database connected\n');

    // 1. Check users table structure
    console.log('📋 USERS TABLE STRUCTURE:');
    console.log('-'.repeat(60));
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    console.table(tableInfo.rows);

    // 2. Check if password or password_hash column exists
    console.log('\n🔑 PASSWORD COLUMN CHECK:');
    console.log('-'.repeat(60));
    const passwordCol = tableInfo.rows.find(r => r.column_name === 'password');
    const passwordHashCol = tableInfo.rows.find(r => r.column_name === 'password_hash');
    
    if (passwordCol) {
      console.log(`✅ 'password' column exists (${passwordCol.data_type}, nullable: ${passwordCol.is_nullable})`);
    } else {
      console.log('❌ \'password\' column DOES NOT EXIST');
    }
    
    if (passwordHashCol) {
      console.log(`⚠️  'password_hash' column exists (${passwordHashCol.data_type}, nullable: ${passwordHashCol.is_nullable})`);
    } else {
      console.log('✅ \'password_hash\' column does not exist (good)');
    }

    // 3. Check actual user data
    console.log('\n👥 USER DATA SAMPLE:');
    console.log('-'.repeat(60));
    const users = await client.query(`
      SELECT 
        id, 
        email, 
        CASE 
          WHEN password IS NOT NULL THEN 'HAS PASSWORD'
          ELSE 'NULL PASSWORD'
        END as password_status,
        first_name,
        last_name,
        created_at
      FROM users
      LIMIT 5;
    `);
    console.table(users.rows);

    // 4. Count users with NULL passwords
    console.log('\n📊 PASSWORD NULL COUNT:');
    console.log('-'.repeat(60));
    const nullCount = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(password) as users_with_password,
        COUNT(*) - COUNT(password) as users_without_password
      FROM users;
    `);
    console.table(nullCount.rows);

    // 5. Check if there's a password_hash column being used
    try {
      const hashCheck = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(password_hash) as with_hash
        FROM users;
      `);
      console.log('\n⚠️  PASSWORD_HASH COLUMN DETECTED:');
      console.table(hashCheck.rows);
    } catch (e) {
      console.log('\n✅ No password_hash column (expected)');
    }

    // 6. Root cause analysis
    console.log('\n🎯 ROOT CAUSE ANALYSIS:');
    console.log('='.repeat(60));
    
    const hasPasswordCol = !!passwordCol;
    const hasPasswordHashCol = !!passwordHashCol;
    const usersWithNullPassword = parseInt(nullCount.rows[0].users_without_password);
    
    if (hasPasswordHashCol && !hasPasswordCol) {
      console.log('❌ CRITICAL: Database has "password_hash" but schema expects "password"');
      console.log('   → Column name mismatch causing query failures');
      console.log('   → FIX: Rename password_hash to password');
    } else if (hasPasswordCol && passwordCol.is_nullable === 'YES' && usersWithNullPassword > 0) {
      console.log('❌ CRITICAL: Password column is nullable and has NULL values');
      console.log(`   → ${usersWithNullPassword} users have NULL passwords`);
      console.log('   → FIX: Update NULL passwords or make column NOT NULL');
    } else if (hasPasswordCol && passwordCol.is_nullable === 'NO') {
      console.log('✅ Password column exists and is NOT NULL');
      console.log('   → Schema is correct');
    }

    console.log('\n📝 RECOMMENDED FIXES:');
    console.log('='.repeat(60));
    
    if (hasPasswordHashCol) {
      console.log('1. Rename password_hash column to password:');
      console.log('   ALTER TABLE users RENAME COLUMN password_hash TO password;');
    }
    
    if (usersWithNullPassword > 0) {
      console.log('2. Set default password for OAuth users or remove NULL constraint:');
      console.log('   UPDATE users SET password = \'oauth_user_no_password\' WHERE password IS NULL;');
      console.log('   OR');
      console.log('   ALTER TABLE users ALTER COLUMN password DROP NOT NULL;');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
  }
}

diagnoseLoginError().catch(console.error);
