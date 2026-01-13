import { NextResponse } from "next/server";

import { getCategories } from "@/lib/data-async";

export async function GET() {
  const categories = await getCategories();
  return NextResponse.json(categories);
}
