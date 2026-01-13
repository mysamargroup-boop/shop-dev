
'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProducts, getCategories, getTags } from "@/lib/data-async";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { deleteProductAction, bulkUpdateProductPrices, bulkAddTagToProducts } from "@/lib/actions";
import { MoreVertical, PlusCircle, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BLUR_DATA_URL } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, Category } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"none" | "price-asc" | "price-desc">("none");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const handleBulkUpdatePricesAction = async (formData: FormData) => {
    await bulkUpdateProductPrices(undefined, formData);
  };
  const handleBulkAddTagAction = async (formData: FormData) => {
    await bulkAddTagToProducts(undefined, formData);
  };

  useEffect(() => {
    async function fetchData() {
      const [fetchedProducts, fetchedCategories, fetchedTags] = await Promise.all([
        getProducts(),
        getCategories(),
        getTags(),
      ]);
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
      setCategories(fetchedCategories);
      setAllTags(fetchedTags);
    }
    fetchData();
  }, []);

  useEffect(() => {
    let tempProducts = products;

    if (searchTerm) {
      tempProducts = tempProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      tempProducts = tempProducts.filter(p =>
        p.category.split(',').map(c => c.trim().toLowerCase()).includes(selectedCategory.toLowerCase())
      );
    }

    if (sortOrder === "price-asc") {
      tempProducts = [...tempProducts].sort((a, b) => a.price - b.price);
    } else if (sortOrder === "price-desc") {
      tempProducts = [...tempProducts].sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(tempProducts);
  }, [searchTerm, selectedCategory, sortOrder, products]);
  
  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      await Promise.all(selectedProducts.map(async (id) => {
        const fd = new FormData();
        fd.append('id', id);
        await deleteProductAction(fd as any);
      }));
      setProducts(products.filter(p => !selectedProducts.includes(p.id)));
      setSelectedProducts([]);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-headline font-bold text-center flex-1">Products</h1>
        <Button asChild>
          <Link href="/wb-admin/products/new"><PlusCircle className="mr-2 h-4 w-4"/> Add Product</Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name.toLowerCase()}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={(v: "none" | "price-asc" | "price-desc") => setSortOrder(v)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sort: Default</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
        {selectedProducts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <form action={handleBulkUpdatePricesAction} className="flex items-center gap-2">
              <input type="hidden" name="ids" value={JSON.stringify(selectedProducts)} />
              <Select name="mode" defaultValue="increase">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increase">Increase</SelectItem>
                  <SelectItem value="decrease">Decrease</SelectItem>
                </SelectContent>
              </Select>
              <Input name="percent" type="number" step="0.1" placeholder="% change" className="w-[120px]" required />
              <Button type="submit" variant="secondary">Apply ({selectedProducts.length})</Button>
            </form>
            <form action={handleBulkAddTagAction} className="flex items-center gap-2">
              <input type="hidden" name="ids" value={JSON.stringify(selectedProducts)} />
              <Select value={selectedTag} onValueChange={setSelectedTag} name="tag">
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="submit" variant="secondary" disabled={!selectedTag}>Add Tag ({selectedProducts.length})</Button>
            </form>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete ({selectedProducts.length})
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        SEO: Title, description and product URL are used. The Short Description is used as meta description (keep ~140–160 chars). No separate meta title or slug.
      </p>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                 <Checkbox
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedProducts(checked ? filteredProducts.map(p => p.id) : []);
                    }}
                  />
              </TableHead>
              <TableHead className="w-20">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead className="w-12 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                 <TableCell>
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onCheckedChange={(checked) => {
                      setSelectedProducts(
                        checked
                          ? [...selectedProducts, product.id]
                          : selectedProducts.filter((id) => id !== product.id)
                      );
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Image
                    src={product.imageUrl}
                    alt={product.imageAlt || product.name}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                    data-ai-hint={product.imageHint}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="48px"
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                <TableCell>₹{product.price.toFixed(2)}</TableCell>
                <TableCell>{product.inventory}</TableCell>
                <TableCell className="text-right">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/wb-admin/products/${product.id}/edit`}>Edit</Link>
                      </DropdownMenuItem>
                       <form action={deleteProductAction}>
                         <input type="hidden" name="id" value={product.id} />
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
       {filteredProducts.length === 0 && (
         <div className="text-center py-16">
           <p className="text-muted-foreground">No products found. Try adjusting your search or filters.</p>
         </div>
       )}
    </div>
  );
}
