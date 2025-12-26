'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  amount: number;
  customerName: string;
  customerPhone: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  transactionId?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading orders...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage and track all customer orders from Supabase database
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            View and manage customer orders from your Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders found in database</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link 
                          href={`/wb-admin/orders/${order.id}`}
                          className="font-mono text-sm hover:underline"
                        >
                          {order.id.slice(0, 8)}...
                        </Link>
                        {order.transactionId && (
                          <p className="text-xs text-muted-foreground">TXN: {order.transactionId.slice(0, 8)}...</p>
                        )}
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.customerPhone}</TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            'text-xs',
                            order.status === 'PAID' && 'bg-green-100 text-green-800 border-green-200',
                            order.status === 'PENDING' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                            order.status === 'FAILED' && 'bg-red-100 text-red-800 border-red-200',
                            order.status === 'CANCELLED' && 'bg-red-100 text-red-800 border-red-200',
                            order.status === 'RETURNED' && 'bg-orange-100 text-orange-800 border-orange-200',
                            order.status === 'REFUNDED' && 'bg-blue-100 text-blue-800 border-blue-200'
                          )}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{order.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
