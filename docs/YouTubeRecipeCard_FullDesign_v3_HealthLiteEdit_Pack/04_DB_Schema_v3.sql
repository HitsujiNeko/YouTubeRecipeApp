-- 07 DB Schema v3 (Supabase/Postgres)
create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;

-- video sources
create table if not exists video_sources (
  id uuid primary key default uuid_generate_v4(),
  platform text not null check (platform in ('youtube')),
  video_id text not null,
  canonical_url text not null,
  channel_id text,
  channel_title text,
  title text,
  thumbnail_url text,
  duration_iso8601 text,
  published_at timestamptz,
  last_refreshed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, video_id)
);

-- recipes
create table if not exists recipes (
  id uuid primary key default uuid_generate_v4(),
  source_id uuid not null references video_sources(id) on delete cascade,
  owner_user_id uuid null,
  anon_edit_token_hash text,
  public_slug text,
  share_enabled_at timestamptz,
  share_slug_rotated_at timestamptz,
  language text not null default 'ja',
  title text not null,
  servings_text text,
  notes text,
  extraction_confidence numeric(3,2) not null default 0.00,
  extraction_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_recipes_public_slug_unique
  on recipes(public_slug)
  where public_slug is not null;

-- ingredients
create table if not exists recipe_ingredients (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  position int not null,
  group_label text,
  name text not null,
  quantity_text text,
  is_optional boolean not null default false,
  created_at timestamptz not null default now(),
  unique(recipe_id, position)
);

-- steps
create table if not exists recipe_steps (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  position int not null,
  text text not null,
  timer_sec int,
  timestamp_sec int,
  is_ai_inferred boolean not null default false,
  created_at timestamptz not null default now(),
  unique(recipe_id, position)
);

-- tags (optional)
create table if not exists tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique
);

create table if not exists recipe_tags (
  recipe_id uuid not null references recipes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- extraction runs
create table if not exists extraction_runs (
  id uuid primary key default uuid_generate_v4(),
  recipe_id uuid references recipes(id) on delete cascade,
  source_id uuid references video_sources(id) on delete cascade,
  extractor_name text not null,
  model_name text,
  status text not null check (status in ('success','failed')),
  error_message text,
  created_at timestamptz not null default now()
);

-- Nutrition: food master
create table if not exists food_items (
  id bigserial primary key,
  source text not null, -- 'mext' etc
  source_food_code text,
  name_ja text not null,
  name_en text,
  category text,
  searchable_name text generated always as (regexp_replace(lower(name_ja), '\s+', '', 'g')) stored,
  unique(source, source_food_code)
);

create table if not exists food_nutrients_per_100g (
  food_id bigint primary key references food_items(id) on delete cascade,
  kcal numeric,
  protein_g numeric,
  fat_g numeric,
  carbs_g numeric,
  salt_g numeric,
  fiber_g numeric,
  updated_at timestamptz not null default now()
);

create table if not exists food_synonyms (
  id bigserial primary key,
  food_id bigint not null references food_items(id) on delete cascade,
  synonym text not null,
  searchable_synonym text generated always as (regexp_replace(lower(synonym), '\s+', '', 'g')) stored
);

create index if not exists idx_food_items_trgm on food_items using gin (searchable_name gin_trgm_ops);
create index if not exists idx_food_syn_trgm on food_synonyms using gin (searchable_synonym gin_trgm_ops);

-- Ingredient matches (manual overrides stored here)
create table if not exists recipe_ingredient_matches (
  ingredient_id uuid primary key references recipe_ingredients(id) on delete cascade,
  matched_food_id bigint references food_items(id),
  match_score numeric(3,2),
  match_method text, -- 'dict'|'trgm'|'manual'
  grams numeric,
  grams_confidence numeric(3,2),
  updated_at timestamptz not null default now()
);

-- Nutrition cache
create table if not exists recipe_nutrition_cache (
  recipe_id uuid primary key references recipes(id) on delete cascade,
  total_kcal numeric,
  total_protein_g numeric,
  total_fat_g numeric,
  total_carbs_g numeric,
  total_salt_g numeric,
  total_fiber_g numeric,
  confidence numeric(3,2) not null default 0.00,
  coverage numeric(3,2) not null default 0.00,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RLS policy design (MVP)
-- - Anonymous edit is API-only with edit token hash verification in Route Handlers.
-- - Supabase client direct write is allowed only for authenticated owner rows.
-- - Shared recipes can be read publicly when public_slug is present.
-- ============================================================

alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table recipe_steps enable row level security;
alter table recipe_ingredient_matches enable row level security;
alter table recipe_nutrition_cache enable row level security;
alter table extraction_runs enable row level security;

drop policy if exists recipes_select_public on recipes;
create policy recipes_select_public
  on recipes
  for select
  to anon, authenticated
  using (public_slug is not null);

drop policy if exists recipes_select_owner on recipes;
create policy recipes_select_owner
  on recipes
  for select
  to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists recipes_write_owner on recipes;
create policy recipes_write_owner
  on recipes
  for all
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

drop policy if exists recipe_ingredients_select_parent on recipe_ingredients;
create policy recipe_ingredients_select_parent
  on recipe_ingredients
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from recipes r
      where r.id = recipe_ingredients.recipe_id
        and (r.public_slug is not null or r.owner_user_id = auth.uid())
    )
  );

drop policy if exists recipe_ingredients_write_owner on recipe_ingredients;
create policy recipe_ingredients_write_owner
  on recipe_ingredients
  for all
  to authenticated
  using (
    exists (
      select 1
      from recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from recipes r
      where r.id = recipe_ingredients.recipe_id
        and r.owner_user_id = auth.uid()
    )
  );

drop policy if exists recipe_steps_select_parent on recipe_steps;
create policy recipe_steps_select_parent
  on recipe_steps
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from recipes r
      where r.id = recipe_steps.recipe_id
        and (r.public_slug is not null or r.owner_user_id = auth.uid())
    )
  );

drop policy if exists recipe_steps_write_owner on recipe_steps;
create policy recipe_steps_write_owner
  on recipe_steps
  for all
  to authenticated
  using (
    exists (
      select 1
      from recipes r
      where r.id = recipe_steps.recipe_id
        and r.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from recipes r
      where r.id = recipe_steps.recipe_id
        and r.owner_user_id = auth.uid()
    )
  );

drop policy if exists recipe_matches_select_parent on recipe_ingredient_matches;
create policy recipe_matches_select_parent
  on recipe_ingredient_matches
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from recipe_ingredients ri
      join recipes r on r.id = ri.recipe_id
      where ri.id = recipe_ingredient_matches.ingredient_id
        and (r.public_slug is not null or r.owner_user_id = auth.uid())
    )
  );

drop policy if exists recipe_matches_write_owner on recipe_ingredient_matches;
create policy recipe_matches_write_owner
  on recipe_ingredient_matches
  for all
  to authenticated
  using (
    exists (
      select 1
      from recipe_ingredients ri
      join recipes r on r.id = ri.recipe_id
      where ri.id = recipe_ingredient_matches.ingredient_id
        and r.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from recipe_ingredients ri
      join recipes r on r.id = ri.recipe_id
      where ri.id = recipe_ingredient_matches.ingredient_id
        and r.owner_user_id = auth.uid()
    )
  );

drop policy if exists recipe_nutrition_select_parent on recipe_nutrition_cache;
create policy recipe_nutrition_select_parent
  on recipe_nutrition_cache
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from recipes r
      where r.id = recipe_nutrition_cache.recipe_id
        and (r.public_slug is not null or r.owner_user_id = auth.uid())
    )
  );

drop policy if exists recipe_nutrition_write_owner on recipe_nutrition_cache;
create policy recipe_nutrition_write_owner
  on recipe_nutrition_cache
  for all
  to authenticated
  using (
    exists (
      select 1
      from recipes r
      where r.id = recipe_nutrition_cache.recipe_id
        and r.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from recipes r
      where r.id = recipe_nutrition_cache.recipe_id
        and r.owner_user_id = auth.uid()
    )
  );

drop policy if exists extraction_runs_owner_only on extraction_runs;
create policy extraction_runs_owner_only
  on extraction_runs
  for select
  to authenticated
  using (
    exists (
      select 1
      from recipes r
      where r.id = extraction_runs.recipe_id
        and r.owner_user_id = auth.uid()
    )
  );
