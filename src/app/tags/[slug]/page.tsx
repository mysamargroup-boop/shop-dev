import { getProducts } from "@/lib/data-async";
import type { Product } from "@/lib/types";
import Image from "next/image";
import { BLUR_DATA_URL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const raw = params.slug.replace(/-/g, " ");
  const tag = raw.trim();
  const title = `${tag} – Gifts & Decor`;
  const description = `Shop ${tag} products curated for gifting and decor. Discover top picks, best sellers, and personalized options.`;
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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://business.woody.co.in";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${tag} – Gifts & Decor`,
    itemListElement: filtered.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseUrl}/collections/${p.category.split(",")[0].trim().toLowerCase().replace(/ /g, "-")}/${p.id}`,
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
            {params.slug.replace(/-/g, " ")}
          </h1>
          <Link className="text-sm underline" href="/shop">
            Shop All
          </Link>
        </div>
        <p className="text-muted-foreground mb-6">
          Explore curated {params.slug.replace(/-/g, " ")} products for gifting and decor. Browse best sellers and top picks.
        </p>
        {filtered.length === 0 ? (
          <p className="text-muted-foreground">No products found for this tag.</p>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Top Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((p) => (
                <div key={p.id} className="border rounded-lg p-3">
                  <Image
                    src={p.imageUrl}
                    alt={p.imageAlt || p.name}
                    width={320}
                    height={320}
                    className="rounded-md object-cover w-full h-auto"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="320px"
                  />
                  <div className="mt-3">
                    <h3 className="font-semibold text-sm">{p.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline">{p.category}</Badge>
                      <span className="font-bold">₹{p.price.toFixed(2)}</span>
                    </div>
                    <Link
                      href={`/sr-admin/products/${p.id}/edit`}
                      className="text-xs underline mt-2 inline-block"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
