#!/usr/bin/env node

const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function addFullNameColumn() {
  try {
    console.log('Adding full_name column to users table...');
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS full_name VARCHAR
    `;
    
    console.log('✅ full_name column added successfully');
    
    // Verify
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'full_name'
    `;
    
    if (columns.length > 0) {
      console.log('✅ Verified: full_name column exists');
    } else {
      console.log('❌ Error: full_name column was not added');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

addFullNameColumn();
