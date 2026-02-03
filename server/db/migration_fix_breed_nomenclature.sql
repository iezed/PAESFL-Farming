-- Migration: Fix breed nomenclature
-- Replace "mundo", "global", "genérica/mundo" with "genérica" for breeds without clear system/country specification

UPDATE public.breed_reference 
SET breed_name = REPLACE(breed_name, ' (mundo)', ' (genérica)')
WHERE breed_name LIKE '% (mundo)';

UPDATE public.breed_reference 
SET breed_name = REPLACE(breed_name, ' (genérica/mundo)', ' (genérica)')
WHERE breed_name LIKE '% (genérica/mundo)';

UPDATE public.breed_reference 
SET breed_name = REPLACE(breed_name, ' (Global)', ' (genérica)')
WHERE breed_name LIKE '% (Global)';

UPDATE public.breed_reference 
SET breed_name = REPLACE(breed_name, ' (global)', ' (genérica)')
WHERE breed_name LIKE '% (global)';

-- Update breed_key for affected breeds
UPDATE public.breed_reference 
SET breed_key = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      breed_name,
      '[àáâãäå]', 'a', 'gi'
    ),
    '[^a-z0-9]+', '_', 'g'
  )
)
WHERE breed_name LIKE '% (genérica)';
