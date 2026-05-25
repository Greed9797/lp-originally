import Link from "next/link";
import { AdminBadge, AdminCard, AdminEmptyState, AdminIndexTable, AdminPage } from "../../admin-components";
import { getWhatsAppContactEvents } from "@/lib/data";
import { summarizeContactEvents, type ContactMetricEvent } from "@/lib/contacts";

const placementLabels: Record<string, string> = {
  home: "Home",
  product: "Produto",
  floating: "Botao flutuante",
  collection: "Colecao",
  header: "Header",
  footer: "Footer",
};

export default async function ContactsAdminPage() {
  const events = await getWhatsAppContactEvents(300);
  const metricEvents: ContactMetricEvent[] = events.map((event) => ({
    id: event.id,
    product_id: event.product_id,
    product_name: event.product?.name || null,
    placement: event.placement,
    source_path: event.source_path,
    created_at: event.created_at,
  }));
  const summary = summarizeContactEvents(metricEvents);

  return (
    <AdminPage
      eyebrow="WhatsApp"
      title="Contatos"
      description="Cliques qualificados que passaram pelos CTAs de WhatsApp. Sem telefone, nome, IP ou dado pessoal."
    >
      <div className="admin-kpi-grid">
        <Kpi label="Total registrado" value={summary.total} />
        <Kpi label="Ultimas 24h" value={summary.last24Hours} />
        <Kpi label="Ultimos 7 dias" value={summary.last7Days} />
        <Kpi label="Ultimos 30 dias" value={summary.last30Days} />
      </div>

      <div className="admin-two-column">
        <AdminCard title="Produtos mais acionados" description="Ranking por clique no WhatsApp. Use para priorizar estoque e vitrine.">
          {summary.byProduct.length ? (
            <div className="admin-ranking-list">
              {summary.byProduct.slice(0, 8).map((item) => (
                <div key={item.productId || "unknown"}>
                  <span>
                    <strong>{item.productName}</strong>
                    <small>{item.productId ? item.productId : "Clique sem produto"}</small>
                  </span>
                  <AdminBadge tone="info">{item.count}</AdminBadge>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState title="Sem contatos ainda" text="Quando alguem clicar em um CTA de WhatsApp, o evento aparece aqui." />
          )}
        </AdminCard>

        <AdminCard title="Origem dos cliques" description="Posicao da loja que gerou a intencao de conversa.">
          {summary.byPlacement.length ? (
            <div className="admin-ranking-list">
              {summary.byPlacement.map((item) => (
                <div key={item.placement}>
                  <span>
                    <strong>{placementLabels[item.placement] || item.placement}</strong>
                    <small>{item.placement}</small>
                  </span>
                  <AdminBadge>{item.count}</AdminBadge>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmptyState title="Sem origem registrada" text="Os CTAs publicos ja estao preparados para registrar home, produto, colecao e botao flutuante." />
          )}
        </AdminCard>
      </div>

      <AdminCard title="Ultimos contatos" description="Linha do tempo dos eventos recentes de WhatsApp.">
        <AdminIndexTable>
          {events.length ? (
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Origem</th>
                  <th>Pagina</th>
                  <th>Variacao</th>
                  <th className="text-right">Data</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 60).map((event) => (
                  <tr key={event.id}>
                    <td>
                      {event.product ? (
                        <Link href={`/admin/produtos/${event.product.id}`} className="font-bold text-[#303030]">{event.product.name}</Link>
                      ) : (
                        "Sem produto"
                      )}
                    </td>
                    <td><AdminBadge tone="info">{placementLabels[event.placement] || event.placement}</AdminBadge></td>
                    <td>{event.source_path || "-"}</td>
                    <td>{event.variant ? `${event.variant.size} / ${event.variant.color}` : "-"}</td>
                    <td className="text-right">{formatDate(event.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <AdminEmptyState
              title="Nenhum contato registrado"
              text="A rota /api/whatsapp/redirect registra o clique e redireciona para o WhatsApp quando a migration estiver aplicada no Supabase."
            />
          )}
        </AdminIndexTable>
      </AdminCard>
    </AdminPage>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
