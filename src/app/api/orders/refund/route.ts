import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { orderId, refundAmount, refundReason, adminNote } = await req.json();
    
    if (!orderId || !refundAmount) {
      return NextResponse.json({ error: 'Order ID and refund amount are required' }, { status: 400 });
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
    
    // Update order with refund info
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        status: 'REFUNDED',
        refund_amount: refundAmount,
        refund_reason: refundReason,
        admin_notes: adminNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log the refund action
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        old_status: order.status,
        new_status: 'REFUNDED',
        reason: refundReason,
        admin_note: adminNote,
        created_by: 'admin',
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({ success: true, order: updatedOrder });
    
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
