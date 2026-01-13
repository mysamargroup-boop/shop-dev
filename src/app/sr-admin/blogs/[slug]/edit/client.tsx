"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter } from "next/navigation";
import { BlogForm } from "@/components/admin/BlogForm";
import { updateBlogPost } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import type { SiteImage, BlogPost } from "@/lib/types";

export default function EditBlogClient({ post, slug, siteImages }: { post: BlogPost, slug: string, siteImages: SiteImage[] }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const updateBlogWithSlug = updateBlogPost.bind(null, slug);
  const [state, formAction] = useFormState(updateBlogWithSlug, undefined);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success", description: "Blog post updated successfully." });
      router.push("/sr-admin/blogs");
    }
    if (state?.errors) {
       toast({ title: "Error", description: "Please check the form for errors.", variant: "destructive" });
    }
  }, [state, router, toast]);

  return (
    <div>
      <BlogForm
        action={formAction}
        post={post}
        buttonText="Update Post"
        initialState={state}
        siteImages={siteImages}
      />
    </div>
  );
}
