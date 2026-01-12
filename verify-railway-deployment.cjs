
const { Pool } = require('pg');

async function verifyDeployment() {
    console.log('🔍 Verifying Railway deployment...');
    
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    
    try {
        // Check database connection
        await client.query('SELECT NOW()');
        console.log('✅ Database connection successful');
        
        // Check essential tables
        const tables = ['users', 'projects', 'content', 'social_accounts'];
        for (const table of tables) {
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = $1
                )
            `, [table]);
            
            if (result.rows[0].exists) {
                console.log(`✅ Table exists: ${table}`);
            } else {
                console.log(`❌ Missing table: ${table}`);
            }
        }
        
        // Check migrations table
        const migrationResult = await client.query(`
            SELECT COUNT(*) as count FROM migrations
        `);
        console.log(`📊 Executed migrations: ${migrationResult.rows[0].count}`);
        
        console.log('✅ Railway deployment verification completed');
        
    } catch (error) {
        console.error('❌ Deployment verification failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    verifyDeployment();
}

module.exports = { verifyDeployment };
