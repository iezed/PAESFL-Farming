-- Migration: Add packaging_cost_per_kg and product_type_custom to transformation_data

-- Add packaging_cost_per_kg column
ALTER TABLE transformation_data 
ADD COLUMN IF NOT EXISTS packaging_cost_per_kg DECIMAL(10, 2) DEFAULT 0;

-- Add product_type_custom column for custom product names
ALTER TABLE transformation_data 
ADD COLUMN IF NOT EXISTS product_type_custom VARCHAR(255);

-- Update existing rows to have 0 packaging cost
UPDATE transformation_data 
SET packaging_cost_per_kg = 0 
WHERE packaging_cost_per_kg IS NULL;
