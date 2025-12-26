
"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProduct } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const updateProductWithId = updateProduct.bind(null, product.id);
  const [state, formAction] = useFormState(updateProductWithId, undefined);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success", description: "Product updated successfully." });
      router.push("/wb-admin/products");
    }
    if (state?.errors) {
       toast({ title: "Error", description: "Please check the form for errors.", variant: "destructive" });
    }
  }, [state, router, toast]);

  return (
    <ProductForm
      action={formAction}
      product={product}
      buttonText="Update Product"
      initialState={state}
    />
  );
}
