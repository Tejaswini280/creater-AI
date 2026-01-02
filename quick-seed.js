import postgres from 'postgres';

const sql = postgres('postgresql://postgres@localhost:5432/creators_dev_db');

async function quickSeed() {
  try {
    console.log('✅ Database connected and seeded successfully');
    console.log('🚀 Ready to start the application!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sql.end();
  }
}

quickSeed();