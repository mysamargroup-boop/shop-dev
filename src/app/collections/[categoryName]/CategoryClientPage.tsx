
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter, Loader2 } from 'lucide-react';
import type { Category, Product } from '@/lib/types';

function CategoryClientPage({ allProducts, category }: { allProducts: Product[], category: Category }) {
  
  const [sort, setSort] = useState('relevance');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [displayPrice, setDisplayPrice] = useState([0, 1000]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  const categoryProducts = useMemo(() => {
    if (!category) return allProducts;
    return allProducts.filter(p => 
      p.category.split(',').map(c => c.trim().toLowerCase().replace(/ /g, '-')).includes(category.id.toLowerCase()) ||
      (p.sub_category && p.sub_category.toLowerCase() === category.id.toLowerCase())
    );
  }, [allProducts, category]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    categoryProducts.forEach(p => {
      p.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [categoryProducts]);

  useEffect(() => {
    setIsFiltering(true);
    // Simulate a short delay to allow the UI to update
    const timer = setTimeout(() => {
        let products = [...categoryProducts];

        products = products.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
        
        if (selectedTags.length > 0) {
        products = products.filter(p => p.tags?.some(tag => selectedTags.includes(tag)));
        }

        switch (sort) {
        case 'price-asc':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            products.sort((a, b) => b.price - a.price);
            break;
        case 'name-asc':
            products.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            products.sort((a, b) => b.name.localeCompare(a.name));
            break;
        default: // 'relevance'
            break;
        }
        setFilteredProducts(products);
        setIsFiltering(false);
    }, 100); // Small delay for better UX

    return () => clearTimeout(timer);

  }, [sort, priceRange, selectedTags, categoryProducts]);
  
  const handleTagChange = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  const FilterSidebar = () => (
    <aside className="w-full md:w-64 lg:w-72 md:pr-8 space-y-6">
      <div>
        <h3 className="font-semibold mb-4 text-lg">Filter by Price</h3>
        <Slider
          defaultValue={[0, 1000]}
          value={displayPrice}
          min={0}
          max={1000}
          step={50}
          onValueChange={setDisplayPrice}
          onValueCommit={setPriceRange}
        />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>₹{displayPrice[0]}</span>
          <span>₹{displayPrice[1]}</span>
        </div>
      </div>
      {availableTags.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 text-lg">Filter by Tags</h3>
          <div className="space-y-2">
            {availableTags.map(tag => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox id={`tag-${tag}`} onCheckedChange={() => handleTagChange(tag)} checked={selectedTags.includes(tag)} />
                <Label htmlFor={`tag-${tag}`} className="font-normal capitalize">{tag}</Label>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <p className="text-sm text-muted-foreground uppercase tracking-widest">Collections</p>
        <h1 className="text-4xl font-headline font-bold text-center">{category?.name}</h1>
      </div>

      <div className="flex flex-col md:flex-row">
        <div className="hidden md:block">
            <FilterSidebar />
        </div>
        
        <main className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-3/4">
                  <div className="p-4 overflow-y-auto">
                    <FilterSidebar />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <p className="text-sm text-muted-foreground">{filteredProducts.length} products</p>
            <Select onValueChange={setSort} defaultValue="relevance">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Alphabetical: A-Z</SelectItem>
                <SelectItem value="name-desc">Alphabetical: Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isFiltering ? (
            <div className="flex items-center justify-center min-h-[300px] text-center py-16 border-dashed border-2 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading products...</p>
                </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-dashed border-2 rounded-lg">
                <h2 className="text-2xl font-semibold">No Products Found</h2>
                <p className="mt-2 text-muted-foreground">Try adjusting your filters.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


export default function CategoryPageWrapper({ allProducts, category }: { allProducts: Product[], category: Category }) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CategoryClientPage allProducts={allProducts} category={category} />
        </Suspense>
    )
}
