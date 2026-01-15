-- Update subcategories to properly reference categories table
-- This migration ensures all sub_category values are valid category IDs

-- First, update any invalid sub_category values to NULL
UPDATE products 
SET sub_category = NULL 
WHERE sub_category IS NOT NULL 
AND sub_category NOT IN (SELECT id FROM categories);

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_products_sub_category' 
        AND table_name = 'products'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT fk_products_sub_category
        FOREIGN KEY (sub_category) REFERENCES categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add index for better performance on sub_category lookups
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(sub_category);

-- Add comment for clarity
COMMENT ON COLUMN products.sub_category IS 'Optional subcategory that references categories table for hierarchical categorization';
