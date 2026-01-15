-- Migration: Add Product Mix support to Module 2
-- This allows multiple products per transformation scenario with distribution percentages

-- Create new table for transformation products (supports multiple products per scenario)
CREATE TABLE IF NOT EXISTS transformation_products (
  id SERIAL PRIMARY KEY,
  scenario_id INTEGER NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  product_type VARCHAR(100) NOT NULL, -- 'queso_fresco', 'queso_madurado', 'yogurt', 'otro', etc.
  product_type_custom VARCHAR(255), -- Custom name when product_type = 'otro'
  distribution_percentage DECIMAL(5, 2) NOT NULL CHECK (distribution_percentage >= 0 AND distribution_percentage <= 100),
  liters_per_kg_product DECIMAL(10, 2) NOT NULL,
  processing_cost_per_liter DECIMAL(10, 2) NOT NULL DEFAULT 0,
  packaging_cost_per_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
  -- Sales channels per product (3 channels: direct, distributors, third/mixed)
  sales_channel_direct_percentage DECIMAL(5, 2) DEFAULT 100.00,
  sales_channel_distributors_percentage DECIMAL(5, 2) DEFAULT 0.00,
  sales_channel_third_percentage DECIMAL(5, 2) DEFAULT 0.00,
  direct_sale_price_per_kg DECIMAL(10, 2),
  distributors_price_per_kg DECIMAL(10, 2),
  third_channel_price_per_kg DECIMAL(10, 2),
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_product_sales_channels_sum CHECK (
    COALESCE(sales_channel_direct_percentage, 0) + 
    COALESCE(sales_channel_distributors_percentage, 0) + 
    COALESCE(sales_channel_third_percentage, 0) = 100.00
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_transformation_products_scenario_id ON transformation_products(scenario_id);

-- Migrate existing transformation_data to transformation_products
-- Only if transformation_data has data and transformation_products is empty
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM transformation_data WHERE product_type IS NOT NULL)
     AND NOT EXISTS (SELECT 1 FROM transformation_products LIMIT 1)
  THEN
    INSERT INTO transformation_products (
      scenario_id, product_type, product_type_custom, distribution_percentage,
      liters_per_kg_product, processing_cost_per_liter, packaging_cost_per_kg,
      sales_channel_direct_percentage, sales_channel_distributors_percentage, sales_channel_third_percentage,
      direct_sale_price_per_kg, distributors_price_per_kg, third_channel_price_per_kg
    )
    SELECT 
      scenario_id, 
      COALESCE(product_type, 'queso_fresco'),
      product_type_custom, -- Custom product name if exists
      100.00 as distribution_percentage, -- Set to 100% for migrated single products
      COALESCE(liters_per_kg_product, 0),
      COALESCE(processing_cost_per_liter, 0),
      COALESCE(packaging_cost_per_kg, 0), -- Use packaging_cost_per_kg if it exists
      COALESCE(sales_channel_direct_percentage, 100),
      COALESCE(sales_channel_distributors_percentage, 0),
      COALESCE(sales_channel_third_percentage, 0),
      direct_sale_price_per_kg,
      distributors_price_per_kg,
      third_channel_price_per_kg
    FROM transformation_data
    WHERE product_type IS NOT NULL;
  END IF;
END $$;
