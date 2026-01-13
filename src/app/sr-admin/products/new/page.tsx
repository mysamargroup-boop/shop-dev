
"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

export default function NewProductPage() {
  const [state, formAction] = useFormState(createProduct, undefined);
  const router = useRouter();
  const { toast } = useToast();

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
        <ProductForm action={formAction} buttonText="Create Product" initialState={state} />
    </div>
  );
}
