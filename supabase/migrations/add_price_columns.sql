-- Add price columns to products table for legacy databases
alter table if exists products
  add column if not exists regular_price numeric(12,2);

alter table if exists products
  add column if not exists sale_price numeric(12,2);

