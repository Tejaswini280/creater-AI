import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Build connection string from individual environment variables or use DATABASE_URL
const buildConnectionString = (): string => {
  // If DATABASE_URL is provided, use it (Railway provides this)
  if (process.env.DATABASE_URL) {
    console.log('✅ Using DATABASE_URL from environment');
    return process.env.DATABASE_URL;
  }

  // Otherwise, build from individual environment variables
  const dbName = process.env.DB_NAME || "creators_dev_db";
  const dbUser = process.env.DB_USER || "creators_dev_user";
  const dbPassword = process.env.DB_PASSWORD || "CreatorsDev54321";
  const dbHost = process.env.DB_HOST || "db";
  const dbPort = process.env.DB_PORT || "5432";

  console.log('✅ Building connection string from individual environment variables');
  return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
};

const connectionString = buildConnectionString();

console.log('🔧 Database connection info:', {
  host: connectionString.includes('@') ? connectionString.split('@')[1].split('/')[0] : 'unknown',
  database: connectionString.split('/').pop()?.split('?')[0] || 'unknown',
  ssl: connectionString.includes('sslmode=require') || process.env.NODE_ENV === 'production'
});

// Create the connection with optimized pooling and SSL for production
const client = postgres(connectionString, {
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idle_timeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30'),
  connect_timeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10'),
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false, // Enable SSL for production (Railway)
  connection: {
    application_name: 'creatornexus',
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // 30 seconds
  },
  onnotice: (notice) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Database notice:', notice);
    }
  },
  onparameter: (parameterStatus) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Database parameter change:', parameterStatus);
    }
  },
  onclose: () => {
    console.log('⚠️  Database connection closed');
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