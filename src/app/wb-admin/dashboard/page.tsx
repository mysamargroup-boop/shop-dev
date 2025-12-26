
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProducts, getCategories } from "@/lib/data-async";
import { Package, LayoutGrid, ArchiveX, Star, CreditCard } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { BLUR_DATA_URL } from "@/lib/constants";
import SandboxButton from "@/components/admin/SandboxButton";

export default async function AdminDashboard() {
  const products = await getProducts();
  const categories = await getCategories();

  const outOfStockCount = products.filter(p => p.inventory === 0).length;
  const bestSellerCount = products.filter(p => p.tags?.includes('Best Seller')).length;
  const recentProducts = products.slice(-5).reverse();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-headline font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to the Woody Business Admin Panel. Here are your current store statistics.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">items in your inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">product categories</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <ArchiveX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">products need restocking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Sellers</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestSellerCount}</div>
            <p className="text-xs text-muted-foreground">products marked as best sellers</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-headline font-bold mb-4">Recent Products</h2>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Inventory</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="rounded-md object-cover"
                      data-ai-hint={product.imageHint}
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      sizes="40px"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell><Badge variant="outline">{product.category}</Badge></TableCell>
                  <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right hidden sm:table-cell">{product.inventory}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments Sandbox</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <SandboxButton />
            <p className="text-xs text-muted-foreground mt-2">Opens Cashfree sandbox checkout in a new tab.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
