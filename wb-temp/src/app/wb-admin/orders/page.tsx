'use client';
import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { getOrders } from "@/lib/data-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, Clock, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Order, OrderDetail } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const OrderTable = ({ orders }: { orders: Order[] }) => (
    <div className="rounded-md border overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {orders.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No orders found in this category.
                        </TableCell>
                    </TableRow>
                )}
                {orders.map((order) => {
                    const details: OrderDetail | undefined = Array.isArray(order.order_details) && order.order_details.length > 0
                        ? order.order_details[0]
                        : undefined;
                    
                    const amount = details?.total_amount ?? 0;
                    
                    return (
                        <TableRow key={order.id}>
                            <TableCell className="font-mono">
                                <Button variant="link" asChild className="p-0 h-auto">
                                <Link href={`/wb-admin/orders/${order.id}`}>
                                    {order.id}
                                </Link>
                                </Button>
                            </TableCell>
                            <TableCell>
                                <div className="font-medium">{order.customer_name}</div>
                                <div className="text-sm text-muted-foreground">{order.customer_phone}</div>
                            </TableCell>
                            <TableCell>
                                {new Date(order.created_at).toLocaleDateString('en-GB', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                })}
                            </TableCell>
                            <TableCell>
                                {Array.isArray(order.custom_image_urls) && order.custom_image_urls.length > 0 ? (
                                <div className="flex items-center gap-2">
                                    <a href={order.custom_image_urls[0]} target="_blank" rel="noopener noreferrer" className="underline text-primary">View</a>
                                    {order.custom_image_urls.length > 1 && (
                                    <span className="text-xs text-muted-foreground">+{order.custom_image_urls.length - 1} more</span>
                                    )}
                                </div>
                                ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                                )}
                            </TableCell>
                            <TableCell className="text-center">
                                <Badge
                                    className={cn(
                                        'text-xs',
                                        order.status === 'PAID' && 'bg-green-100 text-green-800 border-green-200',
                                        order.status === 'PENDING' && 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
                                        order.status === 'FAILED' && 'bg-red-100 text-red-800 border-red-200',
                                        order.status === 'SHIPPED' && 'bg-blue-100 text-blue-800 border-blue-200',
                                        order.status === 'DELIVERED' && 'bg-purple-100 text-purple-800 border-purple-200'
                                    )}
                                >
                                    {order.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                ₹{amount.toFixed(2)}
                            </TableCell>
                        </TableRow>
                    )
                })}
            </TableBody>
        </Table>
    </div>
);


export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        async function fetchOrders() {
            setLoading(true);
            const allOrders = await getOrders();
            setOrders(allOrders);
            setLoading(false);
        }
        fetchOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        if (!searchTerm) return orders;
        const lowercasedFilter = searchTerm.toLowerCase();
        return orders.filter((order) =>
            order.id.toLowerCase().includes(lowercasedFilter) ||
            order.customer_name?.toLowerCase().includes(lowercasedFilter) ||
            order.customer_phone?.includes(searchTerm)
        );
    }, [orders, searchTerm]);

    const pendingOrders = useMemo(() => filteredOrders.filter(o => o.status === 'PENDING'), [filteredOrders]);
    const completedOrders = useMemo(() => filteredOrders.filter((o) => o.status !== 'PENDING'), [filteredOrders]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-xl font-bold">Loading Orders...</p>
                <p className="text-sm text-muted-foreground">Fetching the latest orders...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-headline font-bold flex items-center justify-center gap-3">
                    <ShoppingBag /> Orders
                </h1>
                <p className="text-muted-foreground mt-2">View and manage all customer orders.</p>
            </div>
            
            <div className="flex justify-center">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by ID, name, or phone..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="completed" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="completed">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Completed ({completedOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                        <Clock className="mr-2 h-4 w-4 text-yellow-500" />
                        Pending ({pendingOrders.length})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="completed">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-center text-lg md:text-left md:text-2xl">Completed & Failed Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <OrderTable orders={completedOrders} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="pending">
                     <Card>
                        <CardHeader>
                            <CardTitle>Pending Orders</CardTitle>
                            <CardDescription>
                                These orders were initiated but payment was not completed.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <OrderTable orders={pendingOrders} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
