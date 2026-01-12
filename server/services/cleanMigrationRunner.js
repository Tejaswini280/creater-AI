import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

async function runCleanMigrations() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const client = await pool.connect();
    
    try {
        console.log('🔄 Running clean migrations...');
        
        // Create migrations table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT NOW()
            )
        `);
        
        const migrations = [
            '0001_core_tables_clean.sql',
            '0002_add_missing_columns.sql', 
            '0003_essential_tables.sql',
            '0004_seed_essential_data.sql'
        ];
        
        for (const migration of migrations) {
            const { rows } = await client.query(
                'SELECT name FROM migrations WHERE name = $1',
                [migration]
            );
            
            if (rows.length === 0) {
                console.log(`🚀 Executing: ${migration}`);
                const migrationPath = path.join(__dirname, '../../migrations', migration);
                
                if (fs.existsSync(migrationPath)) {
                    const sql = fs.readFileSync(migrationPath, 'utf8');
                    
                    // Execute migration in transaction
                    await client.query('BEGIN');
                    try {
                        await client.query(sql);
                        await client.query(
                            'INSERT INTO migrations (name) VALUES ($1)',
                            [migration]
                        );
                        await client.query('COMMIT');
                        console.log(`✅ Completed: ${migration}`);
                    } catch (error) {
                        await client.query('ROLLBACK');
                        console.error(`❌ Failed: ${migration}`, error.message);
                        throw error;
                    }
                } else {
                    console.log(`⚠️  Skipping missing: ${migration}`);
                }
            } else {
                console.log(`⏭️  Already executed: ${migration}`);
            }
        }
        
        console.log('✅ All clean migrations completed successfully');
        
    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runCleanMigrations();
}

export { runCleanMigrations };