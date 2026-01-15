import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

import { createPool } from '../db/pool.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migratePackagingCost() {
  let pool = null;
  
  try {
    pool = createPool();
    
    if (!pool) {
      console.error('❌ Migration failed: No database configuration found.');
      console.error('   Please set DATABASE_URL or DB_HOST environment variable.');
      console.error('   Create a .env file in the server/ directory with your database connection string.');
      process.exit(1);
    }
    
    console.log('🔄 Running packaging cost migration...');
    
    // Read migration SQL file
    const migrationPath = join(__dirname, '../db/migration_add_packaging_cost.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ Packaging cost migration completed successfully!');
    console.log('   Added columns:');
    console.log('   - packaging_cost_per_kg');
    console.log('   - product_type_custom');
    console.log('   Updated existing rows with default values.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.error('   Note: Some columns may already exist. This is OK if you\'ve run the migration before.');
    } else {
      console.error('   Full error:', error);
    }
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

migratePackagingCost();
