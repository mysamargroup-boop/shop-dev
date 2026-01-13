'use client';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useState } from 'react';

export default function TransactionIdClient({ transactionId }: { transactionId: string }) {
  const [copied, setCopied] = useState(false);
  if (!transactionId) return null;

  const shortTransactionId = `${transactionId.slice(0, 6)}...${transactionId.slice(-4)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Failed to copy transaction id', e);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
      <div>
        <p className="text-xs text-muted-foreground">Transaction ID</p>
        <p className="font-mono text-sm break-all">{shortTransactionId}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        <Copy className="h-4 w-4 mr-2" />
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}

