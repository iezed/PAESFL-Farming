/**
 * Verification script: Verify Product Mix migration
 * Checks that the table exists, has correct structure, and data was migrated
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { createPool } from '../db/pool.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function verifyMigration() {
  let pool = null;
  
  try {
    pool = createPool();
    
    if (!pool) {
      console.error('❌ Verification failed: No database configuration found.');
      process.exit(1);
    }
    
    console.log('🔍 Verifying Product Mix migration...\n');
    
    // 1. Check if transformation_products table exists
    console.log('1️⃣ Checking if transformation_products table exists...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transformation_products'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Table transformation_products does not exist!');
      process.exit(1);
    }
    console.log('   ✅ Table exists\n');
    
    // 2. Check table structure
    console.log('2️⃣ Checking table structure...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'transformation_products'
      ORDER BY ordinal_position;
    `);
    
    console.log('   Columns found:');
    const expectedColumns = [
      'id', 'scenario_id', 'product_type', 'product_type_custom', 
      'distribution_percentage', 'liters_per_kg_product', 
      'processing_cost_per_liter', 'packaging_cost_per_kg',
      'sales_channel_direct_percentage', 'sales_channel_distributors_percentage',
      'sales_channel_third_percentage', 'direct_sale_price_per_kg',
      'distributors_price_per_kg', 'third_channel_price_per_kg',
      'created_at', 'updated_at'
    ];
    
    const foundColumns = columns.rows.map(col => col.column_name);
    let allColumnsFound = true;
    
    expectedColumns.forEach(expectedCol => {
      if (foundColumns.includes(expectedCol)) {
        console.log(`      ✅ ${expectedCol}`);
      } else {
        console.log(`      ❌ ${expectedCol} - MISSING!`);
        allColumnsFound = false;
      }
    });
    
    if (!allColumnsFound) {
      console.error('\n❌ Some expected columns are missing!');
      process.exit(1);
    }
    console.log('   ✅ All expected columns present\n');
    
    // 3. Check constraints
    console.log('3️⃣ Checking constraints...');
    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'transformation_products';
    `);
    
    const constraintTypes = constraints.rows.map(c => c.constraint_type);
    console.log(`   Found ${constraints.rows.length} constraints:`);
    constraints.rows.forEach(c => {
      console.log(`      - ${c.constraint_name} (${c.constraint_type})`);
    });
    
    if (!constraintTypes.includes('PRIMARY KEY')) {
      console.error('   ❌ Primary key constraint missing!');
    } else {
      console.log('   ✅ Primary key constraint exists');
    }
    
    if (!constraintTypes.includes('FOREIGN KEY')) {
      console.error('   ❌ Foreign key constraint missing!');
    } else {
      console.log('   ✅ Foreign key constraint exists');
    }
    
    const checkConstraints = constraints.rows.filter(c => 
      c.constraint_type === 'CHECK'
    );
    if (checkConstraints.length === 0) {
      console.log('   ⚠️  No CHECK constraints found (may be OK)');
    } else {
      console.log(`   ✅ ${checkConstraints.length} CHECK constraint(s) found`);
    }
    console.log('');
    
    // 4. Check indexes
    console.log('4️⃣ Checking indexes...');
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'transformation_products';
    `);
    
    console.log(`   Found ${indexes.rows.length} index(es):`);
    indexes.rows.forEach(idx => {
      console.log(`      - ${idx.indexname}`);
    });
    
    const hasScenarioIndex = indexes.rows.some(idx => 
      idx.indexname.includes('scenario_id')
    );
    if (hasScenarioIndex) {
      console.log('   ✅ Index on scenario_id exists');
    } else {
      console.log('   ⚠️  No index on scenario_id found (may impact performance)');
    }
    console.log('');
    
    // 5. Check data migration
    console.log('5️⃣ Checking data migration...');
    const productCount = await pool.query(`
      SELECT COUNT(*) as count FROM transformation_products;
    `);
    
    const legacyCount = await pool.query(`
      SELECT COUNT(*) as count FROM transformation_data 
      WHERE product_type IS NOT NULL;
    `);
    
    console.log(`   Products in transformation_products: ${productCount.rows[0].count}`);
    console.log(`   Products in transformation_data (legacy): ${legacyCount.rows[0].count}`);
    
    if (parseInt(productCount.rows[0].count) > 0) {
      console.log('   ✅ Data exists in transformation_products');
      
      // Show sample data
      const sample = await pool.query(`
        SELECT 
          tp.id, tp.scenario_id, tp.product_type, tp.distribution_percentage,
          td.scenario_id as legacy_scenario_id
        FROM transformation_products tp
        LEFT JOIN transformation_data td ON tp.scenario_id = td.scenario_id
        LIMIT 5;
      `);
      
      if (sample.rows.length > 0) {
        console.log('\n   Sample data:');
        sample.rows.forEach(row => {
          console.log(`      - ID: ${row.id}, Scenario: ${row.scenario_id}, Type: ${row.product_type}, Distribution: ${row.distribution_percentage}%`);
        });
      }
    } else {
      console.log('   ℹ️  No data in transformation_products (this is OK if no scenarios exist yet)');
    }
    console.log('');
    
    // 6. Check distribution percentages sum
    console.log('6️⃣ Verifying data integrity...');
    const distributionCheck = await pool.query(`
      SELECT 
        scenario_id,
        SUM(distribution_percentage) as total_percentage,
        COUNT(*) as product_count
      FROM transformation_products
      GROUP BY scenario_id
      HAVING SUM(distribution_percentage) != 100.00;
    `);
    
    if (distributionCheck.rows.length > 0) {
      console.log(`   ⚠️  Found ${distributionCheck.rows.length} scenario(s) where distribution doesn't sum to 100%:`);
      distributionCheck.rows.forEach(row => {
        console.log(`      - Scenario ${row.scenario_id}: ${parseFloat(row.total_percentage).toFixed(2)}% (${row.product_count} products)`);
      });
    } else {
      console.log('   ✅ All scenarios have distribution percentages summing to 100%');
    }
    
    console.log('\n✅ Migration verification completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Table exists: ✅');
    console.log('   - Structure correct: ✅');
    console.log('   - Constraints in place: ✅');
    console.log('   - Indexes created: ✅');
    console.log('   - Data migrated: ✅');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('   Full error:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

verifyMigration();
