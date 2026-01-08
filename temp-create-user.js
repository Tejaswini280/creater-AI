
    const { Client } = require('pg');
    const bcrypt = require('bcrypt');
    
    async function createTestUser() {
      const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/creators_dev_db'
      });
      
      try {
        await client.connect();
        console.log('✅ Connected to database');
        
        // Hash the password
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // Insert test user
        const result = await client.query(`
          INSERT INTO users (email, password_hash, name) 
          VALUES ($1, $2, $3) 
          ON CONFLICT (email) DO UPDATE SET 
            password_hash = EXCLUDED.password_hash,
            name = EXCLUDED.name
          RETURNING id, email, name
        `, ['test@example.com', hashedPassword, 'Test User']);
        
        console.log('✅ Test user created/updated:', result.rows[0]);
        
      } catch (error) {
        console.error('❌ Database error:', error.message);
      } finally {
        await client.end();
      }
    }
    
    createTestUser();
  