import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createPool } from '../db/pool.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateEmailVerification() {
  let pool = null;
  
  try {
    pool = createPool();
    
    if (!pool) {
      console.error('❌ Migration failed: No database configuration found.');
      console.error('   Please set DATABASE_URL or DB_HOST environment variable.');
      console.error('   Create a .env file in the server/ directory with your database connection string.');
      process.exit(1);
    }
    
    console.log('📧 Starting email verification migration...\n');
    
    const migrationPath = path.join(__dirname, '../db/migration_add_email_verification.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ Email verification migration completed successfully!');
    console.log('   Added columns:');
    console.log('   - email_verified (BOOLEAN)');
    console.log('   - email_verification_token (VARCHAR)');
    console.log('   - email_verification_token_expires (TIMESTAMP)');
    console.log('   - Created index: idx_users_email_verification_token');
    console.log('   - Existing users marked as verified (backward compatibility)\n');
    
    // Verify migration
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email_verified', 'email_verification_token', 'email_verification_token_expires')
      ORDER BY column_name
    `);
    
    if (result.rows.length === 3) {
      console.log('✅ Verification: All columns created successfully');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.warn('⚠️  Warning: Some columns may not have been created');
    }
    
    // Check index
    const indexResult = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'users'
      AND indexname = 'idx_users_email_verification_token'
    `);
    
    if (indexResult.rows.length > 0) {
      console.log('   ✓ Index created successfully\n');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.error('   Note: Some columns may already exist. This is OK.');
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

migrateEmailVerification();
