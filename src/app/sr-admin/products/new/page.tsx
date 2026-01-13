
"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { SiteSettings } from "@/lib/types";

export default function NewProductPage() {
  const [state, formAction] = useFormState(createProduct, undefined);
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Failed to load settings", err));
  }, []);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success", description: "Product created successfully." });
      router.push("/sr-admin/products");
    }
    if (state?.errors) {
       toast({ title: "Error", description: "Please check the form for errors.", variant: "destructive" });
    }
  }, [state, router, toast]);

  return (
    <div>
        <ProductForm action={formAction} buttonText="Create Product" initialState={state} defaultIdPrefix={settings?.product_id_prefix} />
    </div>
  );
}
