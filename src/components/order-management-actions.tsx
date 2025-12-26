'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, DollarSign, XCircle, Settings } from 'lucide-react';

interface OrderManagementActionsProps {
  orderId: string;
  currentStatus: string;
  amount: number;
}

export default function OrderManagementActions({ orderId, currentStatus, amount }: OrderManagementActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(amount.toString());
  const [refundReason, setRefundReason] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const handleAction = async (action: string, body: any) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/orders/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...body })
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        alert('Action failed. Please try again.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Order Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cancel Order */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full" disabled={currentStatus !== 'PENDING' && currentStatus !== 'PAID'}>
              <XCircle className="h-4 w-4 mr-2" />
              Cancel Order
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Order</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this order? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cancelReason">Cancellation Reason</Label>
                <Textarea
                  id="cancelReason"
                  placeholder="Enter reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="adminNoteCancel">Admin Notes</Label>
                <Textarea
                  id="adminNoteCancel"
                  placeholder="Additional notes..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
              <Button
                onClick={() => handleAction('cancel', { cancelReason, adminNote })}
                disabled={isLoading || !cancelReason}
                className="w-full"
              >
                {isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Return Order */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" disabled={currentStatus !== 'PAID'}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Process Return
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Return</DialogTitle>
              <DialogDescription>
                Mark this order as returned. This will update the order status.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="returnReason">Return Reason</Label>
                <Textarea
                  id="returnReason"
                  placeholder="Enter reason for return..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="adminNoteReturn">Admin Notes</Label>
                <Textarea
                  id="adminNoteReturn"
                  placeholder="Additional notes..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
              <Button
                onClick={() => handleAction('return', { returnReason, adminNote })}
                disabled={isLoading || !returnReason}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Confirm Return'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Refund Order */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full" disabled={currentStatus !== 'PAID' && currentStatus !== 'RETURNED'}>
              <DollarSign className="h-4 w-4 mr-2" />
              Process Refund
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process Refund</DialogTitle>
              <DialogDescription>
                Process a refund for this order. You can specify the refund amount.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="refundAmount">Refund Amount</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  max={amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Maximum refundable amount: ₹{amount.toFixed(2)}
                </p>
              </div>
              <div>
                <Label htmlFor="refundReason">Refund Reason</Label>
                <Textarea
                  id="refundReason"
                  placeholder="Enter reason for refund..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="adminNoteRefund">Admin Notes</Label>
                <Textarea
                  id="adminNoteRefund"
                  placeholder="Additional notes..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>
              <Button
                onClick={() => handleAction('refund', { 
                  refundAmount: parseFloat(refundAmount), 
                  refundReason, 
                  adminNote 
                })}
                disabled={isLoading || !refundReason || parseFloat(refundAmount) <= 0}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Confirm Refund'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
