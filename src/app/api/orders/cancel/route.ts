import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { orderId, cancelReason, adminNote } = await req.json();
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    const supabase = supabaseAdmin();
    
    // Get current order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Update order status to cancelled
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        status: 'CANCELLED',
        admin_notes: adminNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log the cancellation action
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        old_status: order.status,
        new_status: 'CANCELLED',
        reason: cancelReason,
        admin_note: adminNote,
        created_by: 'admin',
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({ success: true, order: updatedOrder });
    
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
