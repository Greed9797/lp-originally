import Link from "next/link";
import { getCategories, getProducts, getSettings } from "@/lib/data";
import { SetupWarning } from "../setup-warning";
import { formatPrice } from "@/lib/format";

export default async function AdminDashboard() {
  const [products, categories, settings] = await Promise.all([getProducts(true), getCategories(), getSettings()]);
  const published = products.filter((product) => product.status === "published").length;
  const stock = products.reduce((sum, product) => sum + product.variants.reduce((acc, variant) => acc + variant.stock, 0), 0);

  return (
    <div>
      <SetupWarning />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--mint-ink)]">Admin</span>
          <h1 className="brand-display text-5xl text-[var(--toffee-800)]">Painel Originally</h1>
        </div>
        <Link href="/admin/produtos/novo" className="btn btn-mint">Novo produto</Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Kpi label="Produtos" value={String(products.length)} />
        <Kpi label="Publicados" value={String(published)} />
        <Kpi label="Categorias" value={String(categories.length)} />
        <Kpi label="Estoque" value={String(stock)} />
      </div>
      <section className="mt-8 rounded-[24px] bg-white p-6">
        <h2 className="brand-display text-3xl text-[var(--toffee-800)]">Operacao WhatsApp</h2>
        <p className="mt-2 text-[var(--ink-500)]">Numero atual: {settings.whatsapp_number}</p>
        <p className="mt-1 text-[var(--ink-500)]">Ticket base mais alto: {formatPrice(Math.max(...products.map((product) => product.price_cents)))}</p>
      </section>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] bg-white p-6 shadow-[0_12px_30px_rgba(80,40,30,0.06)]">
      <span className="text-xs font-black uppercase tracking-[0.14em] text-[var(--ink-500)]">{label}</span>
      <strong className="brand-display mt-2 block text-5xl text-[var(--toffee-800)]">{value}</strong>
    </div>
  );
}
