
"use client";

import { useEffect } from "react";
import { useFormState } from "react-dom";
import { useRouter, notFound } from "next/navigation";
import { BlogForm } from "@/components/admin/BlogForm";
import { updateBlogPost } from "@/lib/actions";
import { getBlogPostBySlug } from "@/lib/blog-data";
import { useToast } from "@/hooks/use-toast";

export default function EditBlogPage({ params }: { params: { slug: string } }) {
  const post = getBlogPostBySlug(params.slug);
  const router = useRouter();
  const { toast } = useToast();
  
  const updateBlogWithSlug = updateBlogPost.bind(null, params.slug);
  const [state, formAction] = useFormState(updateBlogWithSlug, undefined);

  useEffect(() => {
    if (state?.success) {
      toast({ title: "Success", description: "Blog post updated successfully." });
      router.push("/wb-admin/blogs");
    }
    if (state?.errors) {
       toast({ title: "Error", description: "Please check the form for errors.", variant: "destructive" });
    }
  }, [state, router, toast]);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <BlogForm
        action={formAction}
        post={post}
        buttonText="Update Post"
        initialState={state}
      />
    </div>
  );
}
