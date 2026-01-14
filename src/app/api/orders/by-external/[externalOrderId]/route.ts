
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: { externalOrderId: string } }) {
  try {
    const supabase = supabaseAdmin();

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('external_order_id', params.externalOrderId)
      .single();

    if (error) {
        // If no rows found, it's a 404, otherwise it's a server error
        if (error.code === 'PGRST116') {
             return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }
        throw error;
    }
    
    return NextResponse.json(order);
  } catch (err: any) {
    console.error(`Error fetching order by external id ${params.externalOrderId}:`, err);
    return NextResponse.json({ error: err.message || 'Failed to fetch order' }, { status: 500 });
  }
}
