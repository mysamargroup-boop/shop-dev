
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/wb-admin/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
          <p className="text-xl font-bold animate-pulse bg-gradient-to-r from-yellow-400 to-black bg-clip-text text-transparent">Redirecting...</p>
      </div>
    </div>
  );
}
