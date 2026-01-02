import pg from 'pg';
const { Client } = pg;

// Development database configuration using provided credentials
const devConfig = {
  host: 'localhost',
  port: 5432,
  database: 'creators_dev_db',
  user: 'creators_dev_user',
  password: 'CreatorsDev54321'
};

// Connect to default postgres database first to create the development database
const postgresConfig = {
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres' // You'll need to know your postgres password
};

async function setupDevelopmentDatabase() {
  let client = null;

  try {
    console.log('🔌 Connecting to PostgreSQL...');
    client = new Client(postgresConfig);
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create the development database
    console.log('📝 Creating creators_dev_db database...');
    try {
      await client.query('CREATE DATABASE "creators_dev_db"');
      console.log('✅ Development database created successfully');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('ℹ️ Database already exists');
      } else {
        throw error;
      }
    }

    // Create the development user if it doesn't exist
    console.log('👤 Creating development user...');
    try {
      await client.query(`
        CREATE USER "creators_dev_user" WITH PASSWORD 'CreatorsDev54321'
      `);
      console.log('✅ Development user created');
    } catch (error) {
      if (error.code === '42710') {
        console.log('ℹ️ User already exists');
      } else {
        throw error;
      }
    }

    // Grant permissions
    console.log('🔐 Granting permissions...');
    await client.query(`
      GRANT ALL PRIVILEGES ON DATABASE "creators_dev_db" TO "creators_dev_user"
    `);
    console.log('✅ Permissions granted');

    console.log('\n🎉 Development database setup completed!');
    console.log('📊 Database: creators_dev_db');
    console.log('👤 User: creators_dev_user');
    console.log('🔗 Connection: postgresql://creators_dev_user:CreatorsDev54321@localhost:5432/creators_dev_db');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your postgres password in the script');
    console.log('3. Ensure you have database creation privileges');
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Connection closed');
    }
  }
}

// Run the setup
setupDevelopmentDatabase();
