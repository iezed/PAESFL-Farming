/**
 * Migration script: Add Product Mix support to transformation module
 * Run this after the packaging cost migration
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createPool } from '../db/pool.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function migrateProductMix() {
  let pool = null;
  
  try {
    pool = createPool();
    
    if (!pool) {
      console.error('❌ Migration failed: No database configuration found.');
      console.error('   Please set DATABASE_URL or DB_HOST environment variable.');
      console.error('   Create a .env file in the server/ directory with your database connection string.');
      process.exit(1);
    }
    
    console.log('🔄 Running Product Mix migration...');
    
    // Read migration SQL file
    const migrationPath = join(__dirname, '../db/migration_product_mix.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ Product Mix migration completed successfully!');
    console.log('   Created table: transformation_products');
    console.log('   Supports multiple products per scenario with distribution percentages');
    console.log('   Migrated existing transformation_data to transformation_products');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.error('   Note: Table may already exist. This is OK if you\'ve run the migration before.');
    } else if (error.code === '42704') {
      console.error('   Note: Constraint may already exist. This is OK if you\'ve run the migration before.');
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

migrateProductMix();
