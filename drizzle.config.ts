import { defineConfig } from "drizzle-kit";

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

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: buildConnectionString(),
  },
});
