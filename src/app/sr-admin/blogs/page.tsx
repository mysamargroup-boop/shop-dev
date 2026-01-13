import { getAllBlogPosts } from "@/lib/data-async";
import BlogsClient from "./client";

export default async function BlogsPage() {
  const posts = await getAllBlogPosts();
  return <BlogsClient posts={posts} />;
}
