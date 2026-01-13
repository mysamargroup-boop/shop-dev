import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const supabase = supabaseAdmin();

    const possibleOrderId =
      payload?.order_id ||
      payload?.orderId ||
      payload?.reference_number ||
      payload?.order?.order_id ||
      payload?.shipment?.order_id ||
      null;

    if (!possibleOrderId) {
      console.warn('Shiprocket webhook: Missing order identifier in payload');
      return NextResponse.json({ received: true });
    }

    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('external_order_id', String(possibleOrderId))
      .single();

    const statusText =
      payload?.current_status ||
      payload?.status ||
      payload?.shipment_status ||
      'SHIPPING_UPDATE';
    const awb =
      payload?.awb_code ||
      payload?.awb ||
      payload?.shipment?.awb ||
      null;
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
      const combinedNote = [existingOrder.admin_notes, noteParts.join(' | ')]
        .filter(Boolean)
        .join('\n');
      await supabase
        .from('orders')
        .update({
          admin_notes: combinedNote,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingOrder.id);

      await supabase.from('order_status_history').insert({
        order_id: existingOrder.id,
        old_status: existingOrder.status,
        new_status: existingOrder.status,
        reason: 'Shiprocket webhook',
        admin_note: noteParts.join(' | '),
        created_by: 'shiprocket',
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Shiprocket webhook error:', err);
    return NextResponse.json(
      { error: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
