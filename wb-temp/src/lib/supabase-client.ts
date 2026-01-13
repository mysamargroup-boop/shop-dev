
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Public client (for use in browser)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : (new Proxy({}, {
      get(_target, prop) {
        if (prop === 'then') return null as any;
        throw new Error("Supabase public client is not initialized. Check your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.");
      }
    }) as unknown as SupabaseClient);

// Admin client (for use in server-side functions)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin: SupabaseClient = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })
  : (new Proxy({}, {
      get(_target, prop) {
        if (prop === 'then') return null as any;
        throw new Error("Supabase admin client is not initialized. Check your SUPABASE_SERVICE_ROLE_KEY environment variable.");
      }
    }) as unknown as SupabaseClient);
