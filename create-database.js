import postgres from 'postgres';

async function createDatabase() {
  // Connect to postgres database first
  const adminSql = postgres('postgresql://postgres@localhost:5432/postgres');
  
  try {
    // Check if database exists
    const result = await adminSql`
      SELECT 1 FROM pg_database WHERE datname = 'creators_dev_db'
    `;
    
    if (result.length === 0) {
      // Create the database
      await adminSql.unsafe('CREATE DATABASE creators_dev_db');
      console.log('✅ Database "creators_dev_db" created successfully');
    } else {
      console.log('✅ Database "creators_dev_db" already exists');
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
  } finally {
    await adminSql.end();
  }
}

createDatabase();