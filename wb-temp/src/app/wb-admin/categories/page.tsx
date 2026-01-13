
'use client';

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategories } from "@/lib/data-async";
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
import { deleteCategoryAction } from "@/lib/actions";
import { BLUR_DATA_URL } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    async function fetchCategories() {
      const allCategories = await getCategories();
      setCategories(allCategories);
    }
    fetchCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!q) return categories;
    const qq = q.toLowerCase();
    return categories.filter(c =>
      c.name.toLowerCase().includes(qq) ||
      c.id.toLowerCase().includes(qq)
    );
  }, [categories, q]);


  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-headline font-bold text-center flex-1">Categories</h1>
        <Button asChild>
          <Link href="/wb-admin/categories/new"><PlusCircle className="mr-2 h-4 w-4"/> Add Category</Link>
        </Button>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
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
              <TableHead>Name</TableHead>
              <TableHead>ID (Slug)</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                    data-ai-hint={category.imageHint}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="48px"
                  />
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.id}</TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/wb-admin/categories/${category.id}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                       <form action={deleteCategoryAction}>
                         <input type="hidden" name="id" value={category.id} />
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
       {filteredCategories.length === 0 && (
         <div className="text-center py-16">
           <p className="text-muted-foreground">No categories found. Add your first one to get started.</p>
         </div>
       )}
    </div>
  );
}
