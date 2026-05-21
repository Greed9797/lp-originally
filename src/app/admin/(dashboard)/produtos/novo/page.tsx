import { getCategories } from "@/lib/data";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const categories = await getCategories();
  return <ProductForm categories={categories} />;
}
