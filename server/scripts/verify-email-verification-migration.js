import dotenv from 'dotenv';
import { createPool } from '../db/pool.js';

dotenv.config();

async function verifyMigration() {
  let pool = null;
  
  try {
    pool = createPool();
    
    if (!pool) {
      console.error('❌ No database configuration found.');
      process.exit(1);
    }
    
    console.log('🔍 Verifying email verification migration...\n');
    
    // Check if columns exist
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('email_verified', 'email_verification_token', 'email_verification_token_expires')
      ORDER BY column_name
    `);
    
    if (columnsResult.rows.length === 3) {
      console.log('✅ All columns exist:');
      columnsResult.rows.forEach(col => {
        console.log(`   ✓ ${col.column_name} (${col.data_type}) - Default: ${col.column_default || 'NULL'} - Nullable: ${col.is_nullable}`);
      });
    } else {
      console.error(`❌ Missing columns. Found ${columnsResult.rows.length}/3 columns.`);
      process.exit(1);
    }
    
    // Check index
    const indexResult = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'users'
      AND indexname = 'idx_users_email_verification_token'
    `);
    
    if (indexResult.rows.length > 0) {
      console.log('   ✓ Index created: idx_users_email_verification_token');
    } else {
      console.warn('   ⚠️  Index not found');
    }
    
    // Check existing users
    const usersResult = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN email_verified = true THEN 1 END) as verified,
             COUNT(CASE WHEN email_verified = false THEN 1 END) as unverified
      FROM users
    `);
    
    const stats = usersResult.rows[0];
    console.log(`\n📊 User statistics:`);
    console.log(`   Total users: ${stats.total}`);
    console.log(`   Verified: ${stats.verified}`);
    console.log(`   Unverified: ${stats.unverified}`);
    
    console.log('\n✅ Migration verification complete!\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('   Details:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

verifyMigration();
