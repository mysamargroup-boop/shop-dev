
import { notFound } from "next/navigation";
import { BlogForm } from "@/components/admin/BlogForm";
import { updateBlogPost } from "@/lib/actions";
import { getBlogPostBySlug } from "@/lib/data-async";

export default async function EditBlogPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) {
    notFound();
  }

  return (
    <div>
      <BlogForm
        action={updateBlogPost.bind(null, params.slug)}
        post={post}
        buttonText="Update Post"
        initialState={undefined}
      />
    </div>
  );
}
