import { getBlogPosts } from "@/lib/data-async";
import BlogsClient from "./client";

export default async function BlogsPage() {
  const posts = await getBlogPosts();
  return <BlogsClient posts={posts} />;
}
