import pg from 'pg';
const { Pool } = pg;

let pool = null;

export function createPool() {
  if (pool) return pool;

  // Support Supabase connection string (DATABASE_URL) or individual parameters
  if (process.env.DATABASE_URL) {
    // Supabase requires SSL for all connections
    const isSupabase = process.env.DATABASE_URL.includes('supabase.co');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase uses self-signed certificates, so we need to rejectUnauthorized: false
      ssl: isSupabase ? { rejectUnauthorized: false } : (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false),
    });
  } else {
    // Fallback to individual connection parameters
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'mvp_ganaderia',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

export function getPool() {
  if (!pool) {
    return createPool();
  }
  return pool;
}
