create table if not exists public.navigation_links (
  id bigserial primary key,
  area text not null check (area in ('header','footer')),
  section text,
  href text not null,
  label text not null,
  sort_order integer default 0,
  is_mega_menu boolean default false,
  special boolean default false,
  created_at timestamp with time zone default now()
);

create index if not exists navigation_links_area_idx on public.navigation_links(area);
create index if not exists navigation_links_sort_idx on public.navigation_links(area, sort_order);
