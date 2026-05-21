import { notFound } from "next/navigation";
import { getCategories, getProducts } from "@/lib/data";
import { ProductForm } from "../product-form";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [products, categories] = await Promise.all([getProducts(true), getCategories()]);
  const product = products.find((item) => item.id === id);
  if (!product) notFound();
  return <ProductForm product={product} categories={categories} />;
}
