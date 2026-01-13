import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/data-async";
import path from 'path';
import fs from 'fs/promises';

const productsFilePath = path.join(process.cwd(), 'src', 'lib', 'products.json');
const tagsFilePath = path.join(process.cwd(), 'src', 'lib', 'tags.json');

export async function GET() {
  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  try {
    const productData = await req.json();
    
    // Read existing products
    let products = [];
    try {
        const fileContent = await fs.readFile(productsFilePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        products = Array.isArray(parsed) ? parsed : (parsed.products || []);
    } catch (error) {
        console.error("Error reading products file:", error);
        products = [];
    }

    // Determine if it's an update or create
    const existingIndex = products.findIndex((p: any) => p.id === productData.id);
    
    if (existingIndex > -1) {
        products[existingIndex] = { ...products[existingIndex], ...productData };
    } else {
        // Generate ID if missing (simple fallback)
        if (!productData.id) {
            productData.id = `WB-${Date.now()}`;
        }
        products.push(productData);
    }

    // Write back products
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2));

    // Update tags.json
    const allTags = new Set<string>();
    products.forEach((p: any) => {
        // Assuming tags can be in 'tags' array or inferred from category/other fields
        // The user specifically mentioned "product tags". 
        // If the product object has a 'tags' field, use it.
        if (Array.isArray(p.tags)) {
            p.tags.forEach((t: string) => allTags.add(t));
        }
        // Also add category as a tag if desired, or keep it strict.
        // Let's stick to explicit tags field + maybe specificDescription keywords if useful, 
        // but user said "saare products tags, tags.json file me save ho".
    });
    
    // If the new product has tags, ensure they are added
    if (Array.isArray(productData.tags)) {
        productData.tags.forEach((t: string) => allTags.add(t));
    }

    // Sort and save tags
    const sortedTags = Array.from(allTags).sort();
    await fs.writeFile(tagsFilePath, JSON.stringify({ tags: sortedTags }, null, 2));

    return NextResponse.json({ success: true, product: productData });

  } catch (error: any) {
    console.error("Error saving product:", error);
    return NextResponse.json({ error: error.message || "Failed to save product" }, { status: 500 });
  }
}
