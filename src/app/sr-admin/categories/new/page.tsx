
"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { createCategory } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";

export default function NewCategoryPage() {
  const [state, formAction] = useFormState(createCategory, undefined);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success", description: "Category created successfully." });
      router.push("/sr-admin/categories");
    }
    if (state?.errors) {
       toast({ title: "Error", description: "Please check the form for errors.", variant: "destructive" });
    }
  }, [state, router, toast]);

  return (
    <div>
        <CategoryForm action={formAction} buttonText="Create Category" initialState={state} />
    </div>
  );
}
