"use client";

import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function SandboxButton() {
  const { signIn } = useAuth();
  const handleClick = async () => {
    try {
      const email = prompt("Enter admin email:");
      const pass = prompt("Enter admin password:");
      if (!email || !pass) {
        alert("Sandbox requires admin re-authentication.");
        return;
      }
      try {
        await signIn(email, pass);
      } catch {
        alert("Invalid credentials. Access denied.");
        return;
      }
      const orderId = `WB-TEST-${Date.now()}`;
      // Use Supabase Edge Function directly
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase().functions.invoke('create-order', {
        body: {
          orderId,
          amount: 10,
          customerName: 'Sandbox User',
          customerPhone: '919999999999',
          returnUrl: `${window.location.origin}/order-confirmation`
        }
      });
      
      if (error) throw new Error(error.message || 'Failed to create sandbox payment session');

      if ((window as any).Cashfree && data.payment_session_id) {
        const cfModeEnv = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'SANDBOX').toUpperCase();
        const cashfree = (window as any).Cashfree({
          mode: cfModeEnv === 'PRODUCTION' ? 'production' : 'sandbox'
        });
        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          returnUrl: `${window.location.origin}/order-confirmation?order_id={order_id}`
        }).catch(async () => {
          const url = await getHostedUrl(orderId);
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
          else alert('Could not start sandbox checkout');
        });
      } else {
        const url = await getHostedUrl(orderId);
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
        else alert('Could not start sandbox checkout');
      }
    } catch (e: any) {
      alert(e.message || 'Sandbox test failed');
    }
  };
  
  const getHostedUrl = async (orderId: string) => {
    try {
      const sres = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
      const sdata = await sres.json();
      if (sres.ok) {
        return sdata.payments?.url || sdata.payments_url || null;
      }
    } catch {}
    return null;
  };
  return (
    <Button onClick={handleClick} className="w-full">
      <CreditCard className="mr-2 h-4 w-4" /> Cashfree Sandbox Test
    </Button>
  );
}
