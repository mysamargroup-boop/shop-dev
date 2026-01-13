import { NextResponse } from "next/server";
import path from 'path';
import fs from 'fs/promises';

const categoriesFilePath = path.join(process.cwd(), 'src', 'lib', 'categories.json');

async function getCategories() {
  try {
    const fileContent = await fs.readFile(categoriesFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.categories || [];
  } catch (error) {
    console.error("Error reading categories file:", error);
    return [];
  }
}

export async function GET() {
  const categories = await getCategories();
  return NextResponse.json(categories);
}
