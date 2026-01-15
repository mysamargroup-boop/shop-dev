import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type CouponsAdminPayload =
  | { action: 'list' }
  | { action: 'create'; data: Record<string, unknown> }
  | { action: 'validate'; code: string; subtotal?: number };

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

    const payload = (await req.json()) as CouponsAdminPayload;
    const supabase = createSupabaseAdmin();

    if (payload.action === 'list') {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('code');

      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (payload.action === 'create') {
      const { data, error } = await supabase
        .from('coupons')
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

    if (payload.action === 'validate') {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', payload.code.toUpperCase())
        .eq('active', true)
        .single();
        
      if (error || !coupon) {
        return new Response(
          JSON.stringify({ error: 'Invalid coupon' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
      
      const sub = Number(payload.subtotal || 0);
      let discountAmount = 0;
      if (coupon.type === 'percent') {
        discountAmount = Math.min(sub, sub * (Number(coupon.value) / 100));
      } else if (coupon.type === 'flat') {
        discountAmount = Math.min(sub, Number(coupon.value));
      }
      
      return new Response(JSON.stringify({
        code: coupon.code,
        discountAmount,
        message: `Applied ${coupon.type === 'percent' ? coupon.value + '% OFF' : '₹' + coupon.value + ' OFF'}`
      }), {
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
