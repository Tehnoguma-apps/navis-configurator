-- Catalog restructure: product types (yacht / tender / toy) + 'stock' category.
--
-- 1. boats.product_type: 'yacht' | 'tender' | 'toy' (default 'yacht').
--    Tenders and water toys (e.g. Seabob) become regular catalog products with
--    their own price, specs and equipment, so the whole quote flow
--    (quotes.boat_id, quote_items snapshot, pricing, PDF, template groups,
--    dashboard RPCs) works for them without special-case code.
-- 2. boats.category: 'new' | 'used' | 'stock'.
--
-- Idempotent: safe to run more than once, and works whether or not the
-- original inline CHECK (category IN ('new','used')) exists in the database.
-- Existing rows keep their category and get product_type = 'yacht'.

-- ---------------------------------------------------------------------------
-- 1. product_type column
-- ---------------------------------------------------------------------------
ALTER TABLE public.boats
  ADD COLUMN IF NOT EXISTS product_type text;

-- Backfill (all existing products are yachts)
UPDATE public.boats SET product_type = 'yacht' WHERE product_type IS NULL;

ALTER TABLE public.boats ALTER COLUMN product_type SET DEFAULT 'yacht';
ALTER TABLE public.boats ALTER COLUMN product_type SET NOT NULL;

ALTER TABLE public.boats DROP CONSTRAINT IF EXISTS boats_product_type_check;
ALTER TABLE public.boats
  ADD CONSTRAINT boats_product_type_check
  CHECK (product_type IN ('yacht', 'tender', 'toy'));

-- ---------------------------------------------------------------------------
-- 2. category: allow 'stock'
-- ---------------------------------------------------------------------------
-- Drop the named constraint and any other CHECK on boats that references
-- "category" (the original inline CHECK may carry an auto-generated name).
ALTER TABLE public.boats DROP CONSTRAINT IF EXISTS boats_category_check;

DO $$
DECLARE
  v_con record;
BEGIN
  FOR v_con IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.boats'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%category%'
      AND c.conname <> 'boats_product_type_check'
  LOOP
    EXECUTE format('ALTER TABLE public.boats DROP CONSTRAINT %I', v_con.conname);
  END LOOP;
END;
$$;

-- Normalise unexpected values before re-adding the constraint
UPDATE public.boats
SET category = 'new'
WHERE category IS NULL OR category NOT IN ('new', 'used', 'stock');

ALTER TABLE public.boats ALTER COLUMN category SET DEFAULT 'new';
ALTER TABLE public.boats ALTER COLUMN category SET NOT NULL;

ALTER TABLE public.boats
  ADD CONSTRAINT boats_category_check
  CHECK (category IN ('new', 'used', 'stock'));

-- Catalog filters by status + product_type + category
CREATE INDEX IF NOT EXISTS idx_boats_status_type_category
  ON public.boats (status, product_type, category);

-- ---------------------------------------------------------------------------
-- 3. Import RPC: write category + product_type from payload
-- ---------------------------------------------------------------------------
-- Based on 20260518_002_update_import_boat_rpc.sql. All existing behaviour is
-- kept (SECURITY DEFINER, admin check, specs, categories, items, TBQ flag).
-- New: payload.boat.category and payload.boat.product_type, validated and
-- COALESCEd to the defaults ('new' / 'yacht').

CREATE OR REPLACE FUNCTION public.import_boat_from_pricelist(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_boat_id UUID;
  v_cat_id UUID;
  v_boat JSONB;
  v_cat JSONB;
  v_cat_idx INT;
  v_category TEXT;
  v_product_type TEXT;
  v_total_categories INT := 0;
  v_total_items INT := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_user_id AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only admins can import price lists';
  END IF;

  v_boat := payload->'boat';

  v_category := COALESCE(NULLIF(v_boat->>'category', ''), 'new');
  IF v_category NOT IN ('new', 'used', 'stock') THEN
    RAISE EXCEPTION 'Invalid category: %', v_category;
  END IF;

  v_product_type := COALESCE(NULLIF(v_boat->>'product_type', ''), 'yacht');
  IF v_product_type NOT IN ('yacht', 'tender', 'toy') THEN
    RAISE EXCEPTION 'Invalid product type: %', v_product_type;
  END IF;

  -- 1. Insert boat (product)
  INSERT INTO boats (
    name, brand, model, year, base_price, description_en, description_hr,
    category, product_type, created_by
  )
  VALUES (
    v_boat->>'name',
    v_boat->>'brand',
    v_boat->>'model',
    (v_boat->>'year')::INT,
    (v_boat->>'base_price')::NUMERIC,
    v_boat->>'description_en',
    v_boat->>'description_hr',
    v_category,
    v_product_type,
    v_user_id
  )
  RETURNING id INTO v_boat_id;

  -- 2. Insert specs (batch)
  INSERT INTO boat_specs (boat_id, category, label_en, label_hr, value, sort_order)
  SELECT
    v_boat_id,
    elem->>'category',
    elem->>'label_en',
    elem->>'label_hr',
    elem->>'value',
    (ordinality - 1)::INT
  FROM jsonb_array_elements(payload->'specs') WITH ORDINALITY AS t(elem, ordinality);

  -- 3. Insert categories + items (including TBQ flag)
  FOR v_cat, v_cat_idx IN
    SELECT elem, (ordinality - 1)::INT
    FROM jsonb_array_elements(payload->'categories') WITH ORDINALITY AS t(elem, ordinality)
  LOOP
    INSERT INTO equipment_categories (boat_id, name_en, name_hr, sort_order)
    VALUES (
      v_boat_id,
      v_cat->>'name_en',
      COALESCE(v_cat->>'name_hr', v_cat->>'name_en'),
      v_cat_idx
    )
    RETURNING id INTO v_cat_id;

    v_total_categories := v_total_categories + 1;

    INSERT INTO equipment_items (
      category_id, name_en, name_hr, description_en, description_hr,
      price, currency, is_standard, is_discountable, manufacturer_code,
      is_price_on_request, sort_order
    )
    SELECT
      v_cat_id,
      elem->>'name_en',
      COALESCE(elem->>'name_hr', elem->>'name_en'),
      elem->>'description_en',
      elem->>'description_hr',
      (elem->>'price')::NUMERIC,
      'EUR',
      (elem->>'is_standard')::BOOLEAN,
      COALESCE((elem->>'is_discountable')::BOOLEAN, true),
      elem->>'manufacturer_code',
      COALESCE((elem->>'is_price_on_request')::BOOLEAN, false),
      (ordinality - 1)::INT
    FROM jsonb_array_elements(v_cat->'items') WITH ORDINALITY AS t(elem, ordinality);

    v_total_items := v_total_items + (jsonb_array_length(COALESCE(v_cat->'items', '[]'::JSONB)));
  END LOOP;

  RETURN jsonb_build_object(
    'boatId', v_boat_id,
    'categories', v_total_categories,
    'items', v_total_items
  );
END;
$function$;
