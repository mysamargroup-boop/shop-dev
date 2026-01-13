import { getSiteImages } from "@/lib/data-supabase";
import NewBlogClient from "./client";

export default async function NewBlogPage() {
  const siteImages = await getSiteImages();
  return <NewBlogClient siteImages={siteImages} />;
}
