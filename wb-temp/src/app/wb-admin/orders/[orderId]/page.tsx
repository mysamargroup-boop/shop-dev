import { getOrders, getProductById } from "@/lib/data-async";
import { notFound } from "next/navigation";
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { User, Phone, Calendar, IndianRupee, Hash, CheckCircle, AlertCircle, Clock, ShoppingCart, MapPin, CreditCard, Banknote, Gift, ShoppingBag, Image as ImageIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BLUR_DATA_URL } from "@/lib/constants";
// types intentionally not imported to avoid strict type mismatch with Supabase rows
import TransactionIdClient from "./TransactionIdClient";
import InvoiceDownloadButton from "./InvoiceDownloadButton";

interface OrderItem {
    id: string;
    name: string;
    image_url?: string;
    quantity: number;
    price: number;
    category?: string;
}

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
    const orders = await getOrders();
    const order = orders.find(o => o.id === params.orderId);

    if (!order) {
        notFound();
    }

    const orderDetail = (Array.isArray(order.order_details) ? order.order_details[0] : order.order_details) as any;
    const orderItems: OrderItem[] = orderDetail?.order_items ? (Array.isArray(orderDetail.order_items) ? orderDetail.order_items : [orderDetail.order_items]) : [];
    
    const totalAmount = orderDetail?.total_amount ?? 0;
    const advanceAmount = orderDetail?.advance_amount ?? 0;
    const remainingAmount = orderDetail?.remaining_amount ?? 0;
    const couponCode = orderDetail?.coupon_code || 'None';
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const transactionId = orderDetail?.transaction_id || '';

    const shortTransactionId = transactionId
        ? `${transactionId.slice(0, 6)}...${transactionId.slice(-4)}`
        : '';

    const statusIcon = order.status === 'PAID'
        ? <CheckCircle className="h-5 w-5 text-green-600" />
        : order.status === 'PENDING'
            ? <Clock className="h-5 w-5 text-yellow-600" />
            : <AlertCircle className="h-5 w-5 text-red-600" />;

    const itemsWithDetails = await Promise.all(
        orderItems.map(async (item: OrderItem) => {
            const product = await getProductById(item.id);
            const categorySlug = product?.category ? product.category.split(',')[0].trim().toLowerCase().replace(/ /g, '-') : 'uncategorized';
            return {
                ...item,
                imageUrl: item.image_url || product?.imageUrl || 'https://picsum.photos/seed/placeholder/100',
                name: product?.name || item.name || 'Unknown Product',
                categorySlug: categorySlug,
            };
        })
    );
    
    const customImageUrls = order.custom_image_urls || [];


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
                                        {itemsWithDetails.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="rounded-md object-cover" placeholder="blur" blurDataURL={BLUR_DATA_URL} />
                                                </TableCell>
                                                <TableCell>
                                                    <Link href={`/collections/${item.categorySlug}/${item.id}`} className="font-medium hover:underline" target="_blank">
                                                        {item.name}
                                                    </Link>
                                                    <p className="text-xs text-muted-foreground font-mono">{item.id}</p>
                                                </TableCell>
                                                <TableCell className="text-center">{item.quantity}</TableCell>
                                                <TableCell className="text-right">₹{(item.price ?? 0).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
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
                            <div className="space-y-4">
                                {order.paymentStatus ? (
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            {order.paymentStatus === 'SUCCESS' ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertCircle className="h-5 w-s text-red-600" />}
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Cashfree Status</p>
                                            <p className="font-semibold">{order.paymentStatus}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No payment status information available (likely a pending order).</p>
                                )}

                                {transactionId && <TransactionIdClient transactionId={transactionId} />}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <CardTitle>Order Summary</CardTitle>
                            <InvoiceDownloadButton
                                orderId={order.id}
                                createdAt={order.created_at}
                                customerName={order.customer_name}
                                customerAddress={order.customer_address}
                                customerPhone={order.customer_phone}
                                items={orderItems.map(item => ({
                                    name: item.name,
                                    quantity: item.quantity,
                                    price: item.price ?? 0,
                                }))}
                                subtotal={orderDetail?.subtotal ?? 0}
                                shippingCost={orderDetail?.shipping_cost ?? 0}
                                discountAmount={orderDetail?.discount_amount ?? 0}
                                totalAmount={totalAmount}
                                advanceAmount={advanceAmount}
                                remainingAmount={remainingAmount}
                                couponCode={orderDetail?.coupon_code || undefined}
                            />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Hash className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Order ID</p>
                                    <p className="font-semibold font-mono text-sm">{order.id}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <ShoppingBag className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Quantity</p>
                                    <p className="font-semibold text-sm">{totalQuantity} {totalQuantity > 1 ? 'items' : 'item'}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <IndianRupee className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Total Amount</p>
                                    <p className="font-semibold text-sm">₹{totalAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CreditCard className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Advance Paid</p>
                                    <p className="font-semibold text-sm">₹{advanceAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Banknote className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Remaining Amount</p>
                                    <p className="font-semibold text-sm">₹{remainingAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Gift className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Coupon Code</p>
                                    <p className="font-semibold text-sm">{couponCode}</p>
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
                                            order.status === 'PENDING' && 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
                                            order.status === 'FAILED' && 'bg-red-100 text-red-800 border-red-200'
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
                                    <p className="font-semibold text-sm">{new Date(order.created_at).toLocaleString()}</p>
                                    <p className="font-semibold text-sm">{new Date(order.updated_at).toLocaleString()}</p>
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
                                    <p className="font-semibold text-sm">{order.customer_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="font-semibold text-sm">{order.customer_phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Address</p>
                                    <p className="font-semibold text-sm">{order.customer_address}</p>
                                    <p className="font-semibold text-sm">{order.customer_pincode}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {customImageUrls.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5" />
                                    Customer Images
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                {customImageUrls.map((url, index) => (
                                    <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                                        <Image
                                            src={url}
                                            alt={`Customer Upload ${index + 1}`}
                                            width={150}
                                            height={150}
                                            className="rounded-md object-cover aspect-square hover:scale-105 transition-transform"
                                            placeholder="blur"
                                            blurDataURL={BLUR_DATA_URL}
                                        />
                                    </a>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
