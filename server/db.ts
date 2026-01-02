import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Build connection string from individual environment variables or use DATABASE_URL
const buildConnectionString = (): string => {
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

const connectionString = buildConnectionString();

console.log('Attempting to connect to database with connection string:', connectionString.replace(/\/\/.*@/, '//***:***@'));

// Create the connection with optimized pooling
const client = postgres(connectionString, {
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30'),
  connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10'),
  connection: {
    application_name: 'creatornexus',
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // 30 seconds
  },
  onnotice: (notice) => {
    console.log('Database notice:', notice);
  },
  onparameter: (parameterStatus) => {
    console.log('Database parameter change:', parameterStatus);
  },
  onclose: () => {
    console.log('Database connection closed');
  }
});

// Test the connection with retry logic
const testConnection = async (retries = 3): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await client`SELECT 1`;
      console.log('✅ Database connection successful');
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, errorMessage);

      if (attempt === retries) {
        console.error('❌ All database connection attempts failed');
        console.error('🔧 Please check:');
        console.error('   - Database server is running');
        console.error('   - DATABASE_URL environment variable is correct');
        console.error('   - Network connectivity to database server');
        console.error('   - Database credentials are valid');

        // Don't exit the process, but log the issue clearly
        console.log('⚠️  Application will continue but database operations may fail');
      } else {
        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying database connection in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

testConnection();

export const db = drizzle(client, { schema }); 