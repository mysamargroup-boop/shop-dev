import { getSiteImages } from "@/lib/data-supabase";
import { getBlogPostBySlug } from "@/lib/data-async";
import EditBlogClient from "./client";
import { notFound } from "next/navigation";

export default async function EditBlogPage({ params }: { params: { slug: string } }) {
  const [siteImages, post] = await Promise.all([
    getSiteImages(),
    getBlogPostBySlug(params.slug)
  ]);

  if (!post) {
    notFound();
  }

  return <EditBlogClient post={post} slug={params.slug} siteImages={siteImages} />;
}
