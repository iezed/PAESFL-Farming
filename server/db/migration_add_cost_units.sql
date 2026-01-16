-- Migration: Add unit selection for processing and packaging costs
-- This allows users to specify if costs are per liter ($/L) or per kg ($/kg)

-- Add unit selection fields to transformation_products table
ALTER TABLE transformation_products
ADD COLUMN IF NOT EXISTS processing_cost_unit VARCHAR(10) DEFAULT 'liter' CHECK (processing_cost_unit IN ('liter', 'kg')),
ADD COLUMN IF NOT EXISTS packaging_cost_unit VARCHAR(10) DEFAULT 'kg' CHECK (packaging_cost_unit IN ('liter', 'kg'));

-- Also add processing_cost_per_kg field to support costs per kg
ALTER TABLE transformation_products
ADD COLUMN IF NOT EXISTS processing_cost_per_kg DECIMAL(10, 2) DEFAULT 0;

-- Also add packaging_cost_per_liter field to support costs per liter  
ALTER TABLE transformation_products
ADD COLUMN IF NOT EXISTS packaging_cost_per_liter DECIMAL(10, 2) DEFAULT 0;

-- Update existing records: if processing_cost_per_liter > 0, set unit to 'liter'
-- If packaging_cost_per_kg > 0, set unit to 'kg'
UPDATE transformation_products
SET processing_cost_unit = 'liter'
WHERE processing_cost_per_liter > 0 AND (processing_cost_unit IS NULL OR processing_cost_unit = 'liter');

UPDATE transformation_products
SET packaging_cost_unit = 'kg'
WHERE packaging_cost_per_kg > 0 AND (packaging_cost_unit IS NULL OR packaging_cost_unit = 'kg');
