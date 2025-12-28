"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { BlogForm } from "@/components/admin/BlogForm";
import { createBlogPost } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { SiteImage } from "@/lib/types";

export default function NewBlogClient({ siteImages }: { siteImages: SiteImage[] }) {
  const [state, formAction] = useFormState(createBlogPost, undefined);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success", description: "Blog post created successfully." });
      router.push("/wb-admin/blogs");
    }
    if (state?.errors) {
       toast({ title: "Error", description: "Please check the form for errors.", variant: "destructive" });
    }
  }, [state, router, toast]);

  return (
    <div>
        <BlogForm action={formAction} buttonText="Create Post" initialState={state} siteImages={siteImages} />
    </div>
  );
}
