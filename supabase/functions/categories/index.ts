import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CategoriesPayload =
  | { action: 'list' }
  | { action: 'create'; data: Record<string, unknown> };

function createSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'Content-Type, Authorization, apikey, x-client-info',
      },
    });
  }

  try {
    if (req.method !== 'POST') {
      const url = new URL(req.url);
      const method = req.method.toUpperCase();

      if (method === 'GET' && url.pathname.endsWith('/categories')) {
        const supabase = createSupabaseAdmin();
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) throw error;

        return new Response(JSON.stringify(data || []), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    let payload: CategoriesPayload | any = {};
    try {
      const json = await req.json();
      payload = (json || {}) as CategoriesPayload;
    } catch {
      payload = { action: 'list' } as CategoriesPayload;
    }
    const supabase = createSupabaseAdmin();

    if (!payload || typeof payload !== 'object') {
      payload = { action: 'list' } as CategoriesPayload;
    }

    if ((payload as any).action === 'list' || (payload as any).action === undefined) {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if ((payload as any).action === 'create') {
      const { data, error } = await supabase
        .from('categories')
        .insert(payload.data)
        .select()
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify(data || null), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as any).message)
        : 'Unexpected error';

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
