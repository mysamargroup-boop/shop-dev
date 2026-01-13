
// PURPOSE: Fetches a list of all orders for the main table in the Admin Panel's "Orders" page.
// It retrieves raw order data, including customer details and custom image URLs, regardless of payment status.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Fetches all columns for the order and related order_details, without filtering by payment status
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_details(*)') 
      .order('created_at', { ascending: false }); // Show newest orders first

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ orders: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
