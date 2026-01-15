import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    const payload = await req.json();
    const supabase = createSupabaseAdmin();

    const possibleOrderId =
      payload?.order_id ||
      payload?.orderId ||
      payload?.reference_number ||
      payload?.order?.order_id ||
      payload?.shipment?.order_id ||
      null;

    if (!possibleOrderId) {
      return new Response(
        JSON.stringify({
          received: true,
          warning: 'Missing order identifier in payload',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('external_order_id', String(possibleOrderId))
      .maybeSingle();

    const statusText =
      payload?.current_status ||
      payload?.status ||
      payload?.shipment_status ||
      'SHIPPING_UPDATE';
    const awb =
      payload?.awb_code || payload?.awb || payload?.shipment?.awb || null;
    const courier =
      payload?.courier_name ||
      payload?.courier ||
      payload?.shipment?.courier ||
      null;

    const noteParts: string[] = [];
    noteParts.push(`Shiprocket: ${statusText}`);
    if (awb) noteParts.push(`AWB: ${awb}`);
    if (courier) noteParts.push(`Courier: ${courier}`);

    if (existingOrder) {
      const combinedNote = [
        (existingOrder as any).admin_notes,
        noteParts.join(' | '),
      ]
        .filter(Boolean)
        .join('\n');

      await supabase
        .from('orders')
        .update({
          admin_notes: combinedNote,
          updated_at: new Date().toISOString(),
        })
        .eq('id', (existingOrder as any).id);

      await supabase.from('order_status_history').insert({
        order_id: (existingOrder as any).id,
        old_status: (existingOrder as any).status,
        new_status: (existingOrder as any).status,
        reason: 'Shiprocket webhook',
        admin_note: noteParts.join(' | '),
        created_by: 'shiprocket',
        created_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    const message =
      err && typeof err === 'object' && 'message' in err
        ? String((err as any).message)
        : 'Webhook processing failed';

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
