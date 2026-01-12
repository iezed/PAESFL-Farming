import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  if (process.env.DATABASE_URL) {
    // Show connection string (masked password)
    const masked = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
    console.log('Connection string:', masked);
  } else {
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
  }

  const isSupabase = process.env.DATABASE_URL?.includes('supabase.co');
  console.log('Is Supabase:', isSupabase);
  console.log('NODE_ENV:', process.env.NODE_ENV);

  let pool;
  try {
    if (process.env.DATABASE_URL) {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isSupabase ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
      });
    } else {
      pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'mvp_ganaderia',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        ssl: false,
      });
    }

    console.log('Attempting to connect...');
    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Connection successful!');
    console.log('PostgreSQL version:', result.rows[0].version.substring(0, 50));
    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    if (error.message.includes('password')) {
      console.error('\n💡 Password authentication failed. Possible issues:');
      console.error('   1. Password is incorrect');
      console.error('   2. Password needs URL encoding (special characters like $, @, #, etc.)');
      console.error('   3. Using wrong connection string (pooler vs direct)');
      console.error('\n   Try getting a fresh connection string from Supabase dashboard:');
      console.error('   Settings → Database → Connection string → URI format');
    }
    process.exit(1);
  }
}

testConnection();
