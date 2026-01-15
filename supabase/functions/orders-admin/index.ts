import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type OrdersAdminPayload =
  | { action: 'list' }
  | { action: 'getById'; orderId: string }
  | { action: 'getByExternalId'; externalOrderId: string }
  | { action: 'history'; orderId: string }
  | {
      action: 'cancel';
      orderId: string;
      cancelReason?: string | null;
      adminNote?: string | null;
    }
  | {
      action: 'return';
      orderId: string;
      returnReason?: string | null;
      adminNote?: string | null;
    }
  | {
      action: 'refund';
      orderId: string;
      refundAmount: number;
      refundReason?: string | null;
      adminNote?: string | null;
    };

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

    const payload = (await req.json()) as OrdersAdminPayload;
    const supabase = createSupabaseAdmin();

    if (payload.action === 'list') {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (payload.action === 'getById') {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', payload.orderId)
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify(data || null), {
        status: data ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (payload.action === 'getByExternalId') {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('external_order_id', payload.externalOrderId)
        .maybeSingle();

      if (error) {
        if ((error as any).code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Order not found' }),
            {
              status: 404,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            },
          );
        }
        throw error;
      }

      return new Response(JSON.stringify(data || null), {
        status: data ? 200 : 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (payload.action === 'history') {
      const { data, error } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', payload.orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (payload.action === 'cancel') {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', payload.orderId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!order) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
          status: 'CANCELLED',
          admin_notes: payload.adminNote ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.orderId)
        .select()
        .maybeSingle();

      if (error) throw error;

      await supabase.from('order_status_history').insert({
        order_id: payload.orderId,
        old_status: (order as any).status,
        new_status: 'CANCELLED',
        reason: payload.cancelReason ?? null,
        admin_note: payload.adminNote ?? null,
        created_by: 'admin',
        created_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ success: true, order: updatedOrder }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    if (payload.action === 'return') {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', payload.orderId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!order) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
          status: 'RETURNED',
          return_reason: payload.returnReason ?? null,
          admin_notes: payload.adminNote ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.orderId)
        .select()
        .maybeSingle();

      if (error) throw error;

      await supabase.from('order_status_history').insert({
        order_id: payload.orderId,
        old_status: (order as any).status,
        new_status: 'RETURNED',
        reason: payload.returnReason ?? null,
        admin_note: payload.adminNote ?? null,
        created_by: 'admin',
        created_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ success: true, order: updatedOrder }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    if (payload.action === 'refund') {
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', payload.orderId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!order) {
        return new Response(
          JSON.stringify({ error: 'Order not found' }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
          status: 'REFUNDED',
          refund_amount: payload.refundAmount,
          refund_reason: payload.refundReason ?? null,
          admin_notes: payload.adminNote ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.orderId)
        .select()
        .maybeSingle();

      if (error) throw error;

      await supabase.from('order_status_history').insert({
        order_id: payload.orderId,
        old_status: (order as any).status,
        new_status: 'REFUNDED',
        reason: payload.refundReason ?? null,
        admin_note: payload.adminNote ?? null,
        created_by: 'admin',
        created_at: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({ success: true, order: updatedOrder }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
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
