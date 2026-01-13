
'use client';

import { useState, useEffect } from 'react';
import { Mail, Gift, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { handleSubscription } from '@/ai/flows/handle-subscription';

const SubscriptionPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('hasSeenSubscriptionPopup');
    if (hasSeenPopup) {
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;

      if (scrollPosition > (documentHeight - windowHeight) * 0.3) {
        setIsOpen(true);
        sessionStorage.setItem('hasSeenSubscriptionPopup', 'true');
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const fullPhoneNumber = `91${whatsapp}`;

    try {
      await handleSubscription({ customerName: name, customerPhoneNumber: fullPhoneNumber });
      try {
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone: fullPhoneNumber, source: 'popup' }),
        });
      } catch {}
      toast({
        title: "Subscribed!",
        description: "You're now signed up for exclusive offers. Thank you!",
      });
      setIsOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Subscription Failed",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm rounded-xl bg-gradient-to-br from-card to-background p-6 shadow-2xl m-4 animate-in fade-in-0 zoom-in-95">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 h-7 w-7 rounded-full"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent mb-4 shadow-lg">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-headline text-foreground">Get Exclusive Offers!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join our WhatsApp list for special discounts, new product alerts, and more.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="h-11"
          />
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">+91</span>
            <Input
              type="tel"
              placeholder="Your WhatsApp Number"
              value={whatsapp}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                if (numericValue.length <= 10) {
                    setWhatsapp(numericValue);
                }
              }}
              required
              pattern="[0-9]{10}"
              title="Please enter a valid 10-digit number"
              className="pl-10 h-11"
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : 'Subscribe Now'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionPopup;
