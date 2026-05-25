import Link from "next/link";
import { AdminCard, AdminPage } from "../admin-components";
import { getCategories, getProducts, getSettings, getWhatsAppContactEvents } from "@/lib/data";
import { SetupWarning } from "../setup-warning";
import { formatPrice } from "@/lib/format";
import { summarizeContactEvents } from "@/lib/contacts";

export default async function AdminDashboard() {
  const [products, categories, settings, contactEvents] = await Promise.all([getProducts(true), getCategories(), getSettings(), getWhatsAppContactEvents(300)]);
  const published = products.filter((product) => product.status === "published").length;
  const stock = products.reduce((sum, product) => sum + product.variants.reduce((acc, variant) => acc + variant.stock, 0), 0);
  const contactSummary = summarizeContactEvents(contactEvents.map((event) => ({
    id: event.id,
    product_id: event.product_id,
    product_name: event.product?.name || null,
    placement: event.placement,
    source_path: event.source_path,
    created_at: event.created_at,
  })));

  return (
    <AdminPage
      eyebrow="Admin"
      title="Painel Originally"
      description="Resumo operacional do catalogo, estoque e contatos gerados pelo WhatsApp."
      actions={<Link href="/admin/produtos/novo" className="btn btn-mint">Novo produto</Link>}
    >
      <SetupWarning />
      <div className="admin-kpi-grid">
        <Kpi label="Produtos" value={String(products.length)} />
        <Kpi label="Publicados" value={String(published)} />
        <Kpi label="Categorias" value={String(categories.length)} />
        <Kpi label="Estoque" value={String(stock)} />
      </div>
      <div className="admin-two-column">
        <AdminCard title="Operacao WhatsApp" description="Indicadores sem pedido ou checkout. O clique abre conversa e gera contato rastreavel.">
          <div className="admin-metric-stack">
            <Metric label="Numero atual" value={settings.whatsapp_number} />
            <Metric label="Contatos ultimos 7 dias" value={String(contactSummary.last7Days)} />
            <Metric label="Contatos ultimos 30 dias" value={String(contactSummary.last30Days)} />
            <Metric label="Ticket base mais alto" value={formatPrice(Math.max(0, ...products.map((product) => product.price_cents)))} />
          </div>
          <Link href="/admin/contatos" className="btn btn-ghost mt-5 text-sm">Ver contatos</Link>
        </AdminCard>

        <AdminCard title="Pendencias de catalogo" description="Pontos que impedem produto de vender bem pelo WhatsApp.">
          <div className="admin-metric-stack">
            <Metric label="Produtos em rascunho" value={String(products.length - published)} />
            <Metric label="Sem imagem" value={String(products.filter((product) => product.images.length === 0).length)} />
            <Metric label="Sem preco" value={String(products.filter((product) => product.price_cents <= 0).length)} />
            <Metric label="Sem estoque em variacao" value={String(products.filter((product) => product.variants.length && product.variants.every((variant) => variant.stock <= 0)).length)} />
          </div>
          <Link href="/admin/produtos?status=draft" className="btn btn-ghost mt-5 text-sm">Revisar produtos</Link>
        </AdminCard>
      </div>
    </AdminPage>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
