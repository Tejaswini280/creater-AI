import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import fs from "fs";

// Build connection string from individual environment variables or use DATABASE_URL
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

async function runCodeGenerationMigration() {
  const connectionString = buildConnectionString();
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('🔄 Running generated_code table migration...');
    
    const sql = fs.readFileSync('./server/migrations/add-generated-code-table.sql', 'utf8');
    
    // Execute the migration
    await client.unsafe(sql);
    
    console.log('✅ Migration completed successfully');
    console.log('📊 generated_code table created');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // Check if table already exists
    if (error.message && error.message.includes('already exists')) {
      console.log('ℹ️  Table already exists, skipping migration');
    }
  } finally {
    await client.end();
  }
}

runCodeGenerationMigration();