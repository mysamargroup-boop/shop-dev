
// PURPOSE: Acts as a powerful analytics engine for the main Admin Dashboard.
// It calculates key metrics like total revenue, best-selling products, and sales trends over time.
// This function does NOT return raw order data; it returns computed stats for charts and graphs.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Fetch paid/completed orders with their aggregated details
    const { data: orders, error } = await supabase
      .from('orders')
      .select('created_at, status, payment_status, order_details(total_amount, order_items)')
      .or('status.eq.PAID,payment_status.eq.SUCCESS,payment_status.eq.PAID');

    if (error) throw error;

    const totalRevenue = orders.reduce((acc, order: any) => {
      const details = Array.isArray(order.order_details) ? order.order_details[0] : order.order_details;
      const amt = details?.total_amount ? Number(details.total_amount) : 0;
      return acc + amt;
    }, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const productSales = new Map<string, { quantity: number; revenue: number }>();

    orders.forEach((order: any) => {
      const details = Array.isArray(order.order_details) ? order.order_details[0] : order.order_details;
      const items: Array<{ product_name: string; quantity: number; price: number }> = (details?.order_items ?? []);
      items.forEach((item) => {
        const existing = productSales.get(item.product_name) || { quantity: 0, revenue: 0 };
        productSales.set(item.product_name, {
          quantity: existing.quantity + Number(item.quantity || 0),
          revenue: existing.revenue + Number((item.price || 0) * (item.quantity || 0)),
        });
      });
    });
    
    const salesArray = Array.from(productSales.entries()).map(([name, data]) => ({ name, ...data }));

    const bestSellingByQuantity = [...salesArray].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    const bestSellingByRevenue = [...salesArray].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    
    const salesOverTime = new Map<string, number>();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    orders.forEach((order: any) => {
      const orderDate = new Date(order.created_at);
      if (orderDate >= thirtyDaysAgo) {
        const dateString = orderDate.toISOString().split('T')[0];
        const currentSales = salesOverTime.get(dateString) || 0;
        const details = Array.isArray(order.order_details) ? order.order_details[0] : order.order_details;
        const amt = details?.total_amount ? Number(details.total_amount) : 0;
        salesOverTime.set(dateString, currentSales + amt);
      }
    });

    const formattedSalesOverTime = Array.from(salesOverTime.entries()).map(([date, total]) => ({ date, total })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const analyticsData = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      bestSellingByQuantity,
      bestSellingByRevenue,
      salesOverTime: formattedSalesOverTime
    };

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
