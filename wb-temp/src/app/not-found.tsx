import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
      <h1 className="text-8xl font-bold font-headline text-primary">404</h1>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight">Page Not Found</h2>
      <p className="mt-2 text-lg text-muted-foreground">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back home
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/shop">
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
