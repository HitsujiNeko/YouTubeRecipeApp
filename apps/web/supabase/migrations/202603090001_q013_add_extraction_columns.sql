alter table recipes
  add column if not exists extraction_status text not null default 'no_source';

alter table recipes
  add column if not exists source_text text;

alter table recipes
  drop constraint if exists recipes_extraction_status_check;

alter table recipes
  add constraint recipes_extraction_status_check
  check (extraction_status in ('success','partial','no_recipe_found','no_source'));
