import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { orderId, status, reason, adminNote, refundAmount } = await req.json();
    
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
    }
    
    // Validate status
    const validStatuses = ['CANCELLED', 'RETURNED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status for order management' }, { status: 400 });
    }
    
    // Get Supabase client
    const supabase = supabaseAdmin();
    
    // Update order
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (reason) {
      if (status === 'RETURNED') {
        updateData.return_reason = reason;
      } else if (status === 'REFUNDED') {
        updateData.refund_reason = reason;
      }
    }
    
    if (adminNote) {
      updateData.admin_notes = adminNote;
    }
    
    if (refundAmount && status === 'REFUNDED') {
      updateData.refund_amount = refundAmount;
    }
    
    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log the action (optional - for audit trail)
    await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        old_status: order?.status || 'UNKNOWN',
        new_status: status,
        reason,
        admin_note: adminNote,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({ success: true, order });
    
  } catch (error: any) {
    console.error('Error managing order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
