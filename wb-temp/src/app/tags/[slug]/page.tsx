
import { getProducts } from "@/lib/data-async";
import type { Product } from "@/lib/types";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";
import ProductCard from "@/components/products/ProductCard";
import { slugify } from "@/lib/utils";

function unslugify(slug: string) {
    return slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const tagName = unslugify(params.slug);
  const title = `${tagName} - Bulk Gifts & Corporate Gifting`;
  const description = `Shop our collection of ${tagName.toLowerCase()} products, perfect for corporate events, bulk orders, and special occasions. Discover top picks and personalized options at Woody Business.`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://business.woody.co.in";
  const url = `${baseUrl}/tags/${params.slug}`;
  
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
  };
}

export default async function TagPage({ params }: { params: { slug: string } }) {
  const tag = params.slug.replace(/-/g, " ").toLowerCase();
  const products: Product[] = await getProducts();
  const filtered = products.filter(
    (p) => Array.isArray(p.tags) && p.tags.some((t) => t.toLowerCase() === tag)
  );
  const tagName = unslugify(params.slug);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://business.woody.co.in";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tagName} – Bulk Gifts & Decor`,
    itemListElement: filtered.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/collections/${slugify(p.category.split(",")[0].trim())}/${slugify(p.name)}`,
      name: p.name,
      image: p.imageUrl,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-headline font-bold capitalize">
            {tagName}
          </h1>
          <Link className="text-sm underline" href="/shop">
            Shop All
          </Link>
        </div>
        <p className="text-muted-foreground mb-6">
          Explore curated {tagName.toLowerCase()} products for gifting and decor. Browse best sellers and top picks.
        </p>
        {filtered.length === 0 ? (
          <p className="text-muted-foreground">No products found for this tag.</p>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Top Products for "{tagName}"</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
