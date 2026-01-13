
"use client";

import React, { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { updateCategory } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";
import { getCategories } from "@/lib/data-async";

export default function EditCategoryPage({ params }: { params: { categoryId: string } }) {
  const [category, setCategory] = React.useState<Category | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  const updateCategoryWithId = updateCategory.bind(null, params.categoryId);
  const [state, formAction] = useFormState(updateCategoryWithId, undefined);
  
  useEffect(() => {
    async function fetchCategory() {
      const allCategories = await getCategories();
      const foundCategory = allCategories.find(c => c.id === params.categoryId);
      if (foundCategory) {
        setCategory(foundCategory);
      } else {
        notFound();
      }
    }
    fetchCategory();
  }, [params.categoryId]);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success", description: "Category updated successfully." });
      router.push("/wb-admin/categories");
    }
    if (state?.errors) {
       toast({ title: "Error", description: "Please check the form for errors.", variant: "destructive" });
    }
  }, [state, router, toast]);

  if (!category) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <CategoryForm
        action={formAction}
        category={category}
        buttonText="Update Category"
        initialState={state}
      />
    </div>
  );
}
