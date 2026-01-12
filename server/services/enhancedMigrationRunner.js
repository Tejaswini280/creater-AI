
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { MigrationDependencyResolver } from './migrationDependencyResolver.js';

class EnhancedMigrationRunner {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        this.resolver = new MigrationDependencyResolver();
    }

    async run() {
        const client = await this.pool.connect();
        
        try {
            console.log('🔍 Analyzing migration dependencies...');
            
            // Create migrations table
            await client.query(`
                CREATE TABLE IF NOT EXISTS migrations (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) UNIQUE NOT NULL,
                    executed_at TIMESTAMP DEFAULT NOW()
                )
            `);

            // Load and resolve dependencies
            this.resolver.loadMigrations();
            const executionOrder = this.resolver.getExecutionOrder();
            
            console.log('📋 Execution order:');
            executionOrder.forEach((migration, index) => {
                console.log(`${index + 1}. ${migration}`);
            });

            // Execute migrations in resolved order
            for (const migration of executionOrder) {
                await this.executeMigration(client, migration);
            }

            console.log('✅ All migrations completed successfully');
            
        } catch (error) {
            console.error('❌ Migration error:', error);
            throw error;
        } finally {
            client.release();
            await this.pool.end();
        }
    }

    async executeMigration(client, migrationName) {
        const { rows } = await client.query(
            'SELECT name FROM migrations WHERE name = $1',
            [migrationName]
        );
        
        if (rows.length > 0) {
            console.log(`⏭️  Already executed: ${migrationName}`);
            return;
        }

        console.log(`🚀 Executing migration: ${migrationName}`);
        
        const migrationPath = path.join(__dirname, '../../migrations', migrationName);
        
        if (!fs.existsSync(migrationPath)) {
            console.log(`⚠️  Migration file not found: ${migrationName}`);
            return;
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        await client.query('BEGIN');
        try {
            // Execute migration with error handling
            await this.executeSqlSafely(client, sql, migrationName);
            
            await client.query(
                'INSERT INTO migrations (name) VALUES ($1)',
                [migrationName]
            );
            await client.query('COMMIT');
            console.log(`✅ Migration completed: ${migrationName}`);
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`❌ Migration failed: ${migrationName}`, error.message);
            throw error;
        }
    }

    async executeSqlSafely(client, sql, migrationName) {
        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                } catch (error) {
                    // Handle specific errors gracefully
                    if (error.message.includes('already exists')) {
                        console.log(`📢 Database notice: ${error.message.split('ERROR:')[1]?.trim() || error.message}, skipping`);
                        continue;
                    }
                    
                    if (error.message.includes('does not exist') && statement.includes('DROP')) {
                        console.log(`📢 Database notice: Drop target does not exist, skipping`);
                        continue;
                    }
                    
                    throw error;
                }
            }
        }
    }
}

async function runEnhancedMigrations() {
    const runner = new EnhancedMigrationRunner();
    await runner.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runEnhancedMigrations();
}

export { EnhancedMigrationRunner, runEnhancedMigrations };
