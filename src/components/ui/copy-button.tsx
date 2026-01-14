
'use client';

import { useState } from 'react';
import { Button } from './button';
import { useToast } from '@/hooks/use-toast';
import { Check, ClipboardCopy } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
}

export default function CopyButton({ textToCopy }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: `Coupon code "${textToCopy}" copied to clipboard.`,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to copy',
        description: 'Could not copy text to clipboard.',
      });
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant="outline"
      className="w-full border-dashed border-2 text-lg"
    >
      {isCopied ? (
        <>
          <Check className="mr-2 h-5 w-5 text-green-500" /> Copied
        </>
      ) : (
        <>
          <ClipboardCopy className="mr-2 h-5 w-5" /> Copy Code
        </>
      )}
    </Button>
  );
}
