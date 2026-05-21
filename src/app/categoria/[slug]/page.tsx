import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProductsByCategory, getSettings } from "@/lib/data";
import { ProductCard } from "@/components/product-card";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ category, products }, settings] = await Promise.all([getProductsByCategory(slug), getSettings()]);

  return (
    <main>
      <section className="container-shell py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-black text-[var(--toffee-800)]">
          <ArrowLeft size={16} /> Voltar para a loja
        </Link>
        <span className="mt-10 block text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--mint-ink)]">Categoria</span>
        <h1 className="brand-display mt-2 text-[clamp(2.5rem,5vw,4rem)] leading-[1.1] tracking-[-0.02em] text-[var(--toffee-800)]">{category.name}</h1>
        <p className="mt-3 max-w-2xl text-[clamp(0.875rem,1.5vw,1rem)] leading-[1.65] text-[var(--ink-500)]">{category.description}</p>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => <ProductCard key={product.id} product={product} settings={settings} />)}
        </div>
      </section>
    </main>
  );
}
