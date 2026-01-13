#!/usr/bin/env node

const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function checkTables() {
  try {
    console.log('🔍 Checking tables in database...\n');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log(`Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
    if (tables.length === 0) {
      console.log('\n❌ No tables found! Migrations did not create tables.');
    }
    
    // Check if users table exists
    const usersTable = tables.find(t => t.table_name === 'users');
    if (usersTable) {
      console.log('\n✅ Users table exists');
      
      // Check columns
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `;
      
      console.log('\nUsers table columns:');
      columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`));
    } else {
      console.log('\n❌ Users table does NOT exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

checkTables();
