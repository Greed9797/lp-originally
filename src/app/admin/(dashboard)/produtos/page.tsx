import Link from "next/link";
import { getProducts } from "@/lib/data";
import { formatPrice } from "@/lib/format";

export default async function ProductsAdminPage() {
  const products = await getProducts(true);
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--mint-ink)]">Catalogo</span>
          <h1 className="brand-display text-5xl text-[var(--toffee-800)]">Produtos</h1>
        </div>
        <Link href="/admin/produtos/novo" className="btn btn-mint">Novo produto</Link>
      </div>
      <div className="mt-8 overflow-hidden rounded-[24px] bg-white">
        {products.map((product) => (
          <Link key={product.id} href={`/admin/produtos/${product.id}`} className="grid gap-3 border-b border-[var(--blush-200)] p-5 hover:bg-[var(--blush-50)] md:grid-cols-[1fr_auto_auto] md:items-center">
            <div>
              <strong className="block text-[var(--ink-900)]">{product.name}</strong>
              <span className="text-sm text-[var(--ink-500)]">{product.slug} · {product.category?.name || "Sem categoria"}</span>
            </div>
            <span className="font-black text-[var(--toffee-800)]">{formatPrice(product.price_cents)}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${product.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>
              {product.status === "published" ? "Publicado" : "Rascunho"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
