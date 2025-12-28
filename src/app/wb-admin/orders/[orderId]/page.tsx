
import { notFound } from "next/navigation";
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, Phone, Calendar, IndianRupee, Hash, CheckCircle, AlertCircle, Clock, ShoppingCart } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BLUR_DATA_URL } from "@/lib/constants";
import OrderManagementActions from '@/components/order-management-actions';

async function getOrder(orderId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders`, {
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch order');
    const orders = await response.json();
    return orders.find((o: any) => o.id === orderId);
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

async function getProductById(productId: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products`, {
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data.products?.find((p: any) => p.id === productId);
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
    const order = await getOrder(params.orderId);

    if (!order) {
        notFound();
    }
    
    const statusIcon = order.status === 'PAID' 
        ? <CheckCircle className="h-5 w-5 text-green-600" />
        : order.status === 'PENDING'
            ? <Clock className="h-5 w-5 text-yellow-600" />
            : order.status === 'CANCELLED'
                ? <AlertCircle className="h-5 w-5 text-red-600" />
                : order.status === 'RETURNED'
                    ? <RotateCcw className="h-5 w-5 text-orange-600" />
                    : order.status === 'REFUNDED'
                        ? <DollarSign className="h-5 w-5 text-blue-600" />
                        : <AlertCircle className="h-5 w-5 text-red-600" />;

    const itemsWithDetails = await Promise.all(
        (order.items || []).map(async (item: any) => {
            const product = await getProductById(item.id);
            return {
                ...item,
                imageUrl: product?.imageUrl || 'https://picsum.photos/seed/placeholder/100',
                imageHint: product?.imageHint || 'product image',
                category: product?.category || ''
            };
        })
    );


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
                <p className="text-muted-foreground">Viewing information for order <span className="font-mono">{order.id}</span></p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Ordered Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="rounded-md border overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-20">Image</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-center">Quantity</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {itemsWithDetails.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center">No items found in this order.</TableCell>
                                            </TableRow>
                                        )}
                                        {itemsWithDetails.map(item => {
                                            const categorySlug = item.category.split(',')[0].trim().toLowerCase().replace(/ /g, '-');
                                            return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded-md object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                                                </TableCell>
                                                <TableCell>
                                                    <Link href={`/collections/${categorySlug}/${item.id}`} className="font-medium hover:underline" target="_blank">
                                                        {item.name}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground font-mono">{item.id}</p>
                                                </TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                                            </TableRow>
                                        )})}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Payment Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.paymentStatus ? (
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {order.paymentStatus === 'SUCCESS' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-5 text-red-600" />}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Cashfree Status</p>
                                        <p className="font-semibold">{order.paymentStatus}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No payment status information available (likely a pending order).</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Hash className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Order ID</p>
                                    <p className="font-semibold font-mono text-sm">{order.id}</p>
                                    {order.transactionId && (
                                        <p className="text-xs text-muted-foreground mt-1">Transaction ID: {order.transactionId}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <IndianRupee className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Amount</p>
                                    <p className="font-semibold text-sm">₹{order.amount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1">{statusIcon}</div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Status</p>
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
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Created / Updated</p>
                                    <p className="font-semibold text-sm">{new Date(order.createdAt).toLocaleString()}</p>
                                    <p className="font-semibold text-sm">{new Date(order.updatedAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Name</p>
                                    <p className="font-semibold text-sm">{order.customerName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="font-semibold text-sm">{order.customerPhone}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <OrderManagementActions 
                        orderId={order.id} 
                        currentStatus={order.status} 
                        amount={order.amount} 
                    />
                </div>
            </div>
        </div>
    );
}
