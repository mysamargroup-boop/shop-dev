
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createCoupon, deleteCoupon, toggleCouponStatus, toggleCouponVisibility } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';
import { Coupon } from '@/lib/types';
import { Trash2, Loader2, Edit, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const initialState = {
  message: null,
  errors: {},
  success: false,
};

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Coupon' : 'Create Coupon')}
    </Button>
  );
}

export default function CouponsForm({ coupons }: { coupons: Coupon[] }) {
  const [state, formAction] = useFormState(createCoupon, initialState);
  const [updateState, updateFormAction] = useFormState(updateCoupon, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [currentCode, setCurrentCode] = useState('');
  const [currentType, setCurrentType] = useState('percent');
  const [currentValue, setCurrentValue] = useState<number | string>('');
  const [showOnOffers, setShowOnOffers] = useState(false);

  useEffect(() => {
    const formState = isEditing ? updateState : state;
    if (formState?.success) {
      toast({ title: "Success", description: `Coupon ${isEditing ? 'updated' : 'created'} successfully.` });
      handleCancelEdit();
    } else if (formState?.message) {
      toast({ title: "Error", description: formState.message, variant: "destructive" });
    }
  }, [state, updateState, isEditing, toast]);

  const handleDelete = async (code: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
        const result = await deleteCoupon(code);
        if (result.success) {
            toast({ title: "Success", description: "Coupon deleted." });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    }
  };

  const handleToggle = async (code: string) => {
      const result = await toggleCouponStatus(code);
      if (result.success) {
          toast({ title: "Success", description: "Coupon status updated." });
      } else {
          toast({ title: "Error", description: result.message, variant: "destructive" });
      }
  };
  
  const handleVisibilityToggle = async (code: string) => {
      const result = await toggleCouponVisibility(code);
      if (result.success) {
          toast({ title: "Success", description: "Coupon visibility updated." });
      } else {
          toast({ title: "Error", description: result.message, variant: "destructive" });
      }
  };


  const handleEdit = (coupon: Coupon) => {
      setIsEditing(coupon.code);
      setCurrentCode(coupon.code);
      setCurrentType(coupon.type);
      setCurrentValue(coupon.value);
      setShowOnOffers(coupon.show_on_offers_page || false);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(null);
    setCurrentCode('');
    setCurrentType('percent');
    setCurrentValue('');
    setShowOnOffers(false);
    formRef.current?.reset();
  }

  const action = isEditing ? updateFormAction : formAction;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? `Editing Coupon: ${isEditing}`: 'Create New Coupon'}</CardTitle>
          <CardDescription>{isEditing ? 'Update the details for this coupon.' : 'Add a new discount code for your store.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={action} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <input type="hidden" name="originalCode" value={isEditing || ''} />
                <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" placeholder="SUMMER25" required value={currentCode} onChange={(e) => setCurrentCode(e.target.value.toUpperCase())} />
                </div>
                <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" value={currentType} onValueChange={(value) => setCurrentType(value as 'percent' | 'flat')}>
                    <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div className="grid gap-2">
                <Label htmlFor="value">Value</Label>
                <Input id="value" name="value" type="number" placeholder="10" required min="0" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} />
                </div>
            </div>
             <div className="flex items-center space-x-2 pt-2">
                <Switch id="show_on_offers_page" name="show_on_offers_page" checked={showOnOffers} onCheckedChange={setShowOnOffers}/>
                <Label htmlFor="show_on_offers_page">Show on Offers Page</Label>
            </div>
            <div className="flex gap-2">
              <SubmitButton isEditing={!!isEditing} />
              {isEditing && <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>}
            </div>
          </form>
          {state?.errors?.code && <p className="text-red-500 text-sm mt-1">{state.errors.code}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b bg-muted/50 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Code</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Discount</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Active</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Visible on Offers</th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {coupons.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-4 text-center text-muted-foreground">No coupons found.</td>
                        </tr>
                    )}
                    {coupons.map((coupon) => (
                        <tr key={coupon.code} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <td className="p-4 align-middle font-medium">{coupon.code}</td>
                            <td className="p-4 align-middle">
                                {coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}
                            </td>
                            <td className="p-4 align-middle">
                                <Switch
                                  checked={coupon.active}
                                  onCheckedChange={() => handleToggle(coupon.code)}
                                  aria-label="Toggle coupon status"
                                />
                            </td>
                            <td className="p-4 align-middle">
                                <Switch
                                  checked={coupon.show_on_offers_page}
                                  onCheckedChange={() => handleVisibilityToggle(coupon.code)}
                                  aria-label="Toggle coupon visibility"
                                />
                            </td>
                            <td className="p-4 align-middle text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)} title="Edit">
                                    <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.code)} title="Delete">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
