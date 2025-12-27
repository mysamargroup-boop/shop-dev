
'use client';
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreVertical, PlusCircle, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { deleteBlogPostAction } from "@/lib/actions";
import { BLUR_DATA_URL } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import type { BlogPost } from "@/lib/types";

export default function BlogsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [q, setQ] = useState('');
  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/blogs');
        const json = await res.json();
        setPosts(json || []);
      } catch (e) {
        setPosts([]);
      }
    };
    run();
  }, []);
  const filtered = useMemo(() => {
    if (!q) return posts;
    const qq = q.toLowerCase();
    return posts.filter(p =>
      p.title.toLowerCase().includes(qq) ||
      p.slug.toLowerCase().includes(qq) ||
      p.author.toLowerCase().includes(qq)
    );
  }, [posts, q]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-bold text-center flex-1">Blog Posts</h1>
        <Button asChild>
          <Link href="/wb-admin/blogs/new"><PlusCircle className="mr-2 h-4 w-4"/> Add Post</Link>
        </Button>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            className="pl-10"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
              <TableRow>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((post) => (
              <TableRow key={post.slug}>
                <TableCell>
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                    data-ai-hint={post.imageHint}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="48px"
                  />
                </TableCell>
                <TableCell className="font-medium">{post.title}</TableCell>
                <TableCell>{post.slug}</TableCell>
                <TableCell>{post.author}</TableCell>
                <TableCell>{post.date}</TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/wb-admin/blogs/${post.slug}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                       <form action={deleteBlogPostAction.bind(null, post.slug)}>
                         <DropdownMenuItem asChild>
                          <button type="submit" className="w-full text-left text-destructive">Delete</button>
                         </DropdownMenuItem>
                       </form>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
       {filtered.length === 0 && (
         <div className="text-center py-16">
           <p className="text-muted-foreground">No blog posts found. Add your first post to get started.</p>
         </div>
       )}
    </div>
  );
}
