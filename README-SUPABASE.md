# Supabase Setup Instructions

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get project URL and keys from Settings > API

## 2. Add Credentials to .env.local
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 3. Setup Database
1. Run schema.sql in Supabase SQL Editor
2. Run migration: `supabase/migrations/complete_migration.sql`

## 4. Migrate Data
```bash
node scripts/migrate-to-supabase.js
```

## 5. Update API Routes
Replace existing routes with Supabase versions:
- `/api/products/route.ts` → use `route-supabase.ts`
- `/api/categories/route.ts` → use `route-supabase.ts`
- `/api/orders/route.ts` → new Supabase version

## 6. Order Management API Endpoints

Admin-only endpoints for order management:

- `POST /api/orders/cancel` - Cancel order
- `POST /api/orders/return` - Process return  
- `POST /api/orders/refund` - Process refund
- `POST /api/orders/manage` - General order status update
- `GET /api/orders/history?orderId=xxx` - Get order status history

## 7. Test
- Check admin panel shows transaction_id
- Test order creation
- Verify webhook updates work
- Test order management features

## Files Created
- `src/lib/supabase.ts` - Supabase client setup
- `scripts/migrate-to-supabase.js` - Data migration script
- `supabase/migrations/complete_migration.sql` - Complete migration file
- New API routes with Supabase integration
