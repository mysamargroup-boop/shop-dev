
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/data-async";
import EditProductForm from './EditProductForm';

export default async function EditProductPage({ params }: { params: { productId: string } }) {
  const product = await getProductById(params.productId);
  
  if (!product) {
    notFound();
  }

  return (
    <div>
      <EditProductForm product={product} />
    </div>
  );
}
