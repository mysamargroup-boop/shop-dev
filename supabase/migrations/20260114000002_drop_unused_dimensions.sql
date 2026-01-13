
-- Drop unused columns from products table
ALTER TABLE products DROP COLUMN IF EXISTS weight;
ALTER TABLE products DROP COLUMN IF EXISTS dimensions;
ALTER TABLE products DROP COLUMN IF EXISTS weight_grams;
ALTER TABLE products DROP COLUMN IF EXISTS dimensions_length;
ALTER TABLE products DROP COLUMN IF EXISTS dimensions_width;
ALTER TABLE products DROP COLUMN IF EXISTS dimensions_height;

-- Drop tags table as tags are now stored in products array
DROP TABLE IF EXISTS tags;

-- Create RPC to get unique tags from products table
CREATE OR REPLACE FUNCTION get_unique_tags()
RETURNS TABLE (tag text)
LANGUAGE sql
AS $$
  SELECT DISTINCT unnest(tags)
  FROM products
  WHERE tags IS NOT NULL
  ORDER BY 1;
$$;
