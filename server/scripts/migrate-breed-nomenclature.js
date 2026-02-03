import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createPool } from '../db/pool.js';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateBreedNomenclature() {
  let pool = null;
  
  try {
    pool = createPool();
    
    if (!pool) {
      console.error('❌ Migration failed: No database configuration found.');
      console.error('   Please set DATABASE_URL or DB_HOST environment variable.');
      process.exit(1);
    }
    
    console.log('🐐 Starting breed nomenclature migration...\n');
    
    const migrationPath = path.join(__dirname, '../db/migration_fix_breed_nomenclature.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await pool.query(migrationSQL);
    console.log('✅ Breed nomenclature migration completed successfully!');
    console.log('   Updated breed names:');
    console.log('   - "Saanen (mundo)" → "Saanen (genérica)"');
    console.log('   - "Saanen (genérica/mundo)" → "Saanen (genérica)"');
    console.log('   - "Alpina (genérica/mundo)" → "Alpina (genérica)"');
    console.log('   - "Mestiza (mundo)" → "Mestiza (genérica)"');
    console.log('   - "Criolla (mundo)" → "Criolla (genérica)"');
    console.log('   - Replaced "Global" and "global" with "genérica"');
    console.log('   - Updated breed_key for affected breeds\n');
    
    // Verify migration
    const result = await pool.query(`
      SELECT breed_name, breed_key
      FROM public.breed_reference
      WHERE breed_name LIKE '%genérica%'
      ORDER BY breed_name
      LIMIT 10
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Verification: Found breeds with "genérica" nomenclature:');
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.breed_name} (${row.breed_key})`);
      });
    }
    
    // Check for any remaining "mundo" or "global"
    const checkResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM public.breed_reference
      WHERE breed_name LIKE '%mundo%' 
         OR breed_name LIKE '%global%'
         OR breed_name LIKE '%Global%'
    `);
    
    const remainingCount = parseInt(checkResult.rows[0].count);
    if (remainingCount === 0) {
      console.log('\n✅ All breed names updated correctly - no "mundo" or "global" found\n');
    } else {
      console.warn(`\n⚠️  Warning: Found ${remainingCount} breeds still with "mundo" or "global"`);
      console.warn('   You may need to check these manually\n');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('   Error details:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

migrateBreedNomenclature();
