import type { ReactNode } from "react";
import { CloudUpload, Database, ImageIcon, RefreshCw, ShieldCheck } from "lucide-react";
import { AdminBadge, AdminCard, AdminEmptyState, AdminPage } from "../../admin-components";
import { getImportRuns } from "@/lib/data";
import { hasServiceRoleEnv } from "@/lib/supabase/env";
import { runOriginallyImportAction } from "../../actions";

export default async function ImportAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; products?: string; images?: string }>;
}) {
  const [params, runs] = await Promise.all([searchParams, getImportRuns(8)]);
  const configured = hasServiceRoleEnv();

  return (
    <AdminPage
      eyebrow="Catalogo Mercos"
      title="Importacao Originally"
      description="Capture produtos, categorias e imagens do catalogo Originally Pet e sincronize tudo no Supabase sem expor chaves no client."
    >
      <StatusMessage status={params.status} products={params.products} images={params.images} />

      <section className="admin-two-column">
        <AdminCard>
          <form action={runOriginallyImportAction}>
          <div className="flex items-start gap-3">
            <span className="rounded-2xl bg-[var(--mint-100)] p-3 text-[var(--mint-ink)]">
              <RefreshCw size={20} />
            </span>
            <div>
              <h2 className="brand-display text-3xl text-[var(--toffee-800)]">Reprocessar catalogo</h2>
              <p className="mt-1 text-sm text-[var(--ink-500)]">
                A importacao usa Origin/Referer da loja oficial. Produtos sem preco entram como rascunho para revisao no admin.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="shopify-toggle">
              <input type="checkbox" name="upload_images" defaultChecked />
              <span>
                <strong>Subir imagens para Supabase Storage</strong>
                <small>Quando desligado, salva as URLs remotas e termina mais rapido.</small>
              </span>
            </label>

            <button className="btn btn-mint justify-self-start" disabled={!configured}>
              <CloudUpload size={17} />
              Importar catalogo agora
            </button>

            {!configured ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                Configure `SUPABASE_SERVICE_ROLE_KEY` para liberar importacao no servidor.
              </p>
            ) : null}
          </div>
          </form>
        </AdminCard>

        <AdminCard title="Checklist seguro">
          <div className="mt-5 grid gap-3 text-sm text-[var(--ink-600)]">
            <Check icon={<ShieldCheck size={18} />} text="Service role fica somente no servidor." />
            <Check icon={<Database size={18} />} text="Upsert idempotente por source_id Mercos." />
            <Check icon={<ImageIcon size={18} />} text="Limite de 12 imagens por produto preservado." />
          </div>
        </AdminCard>
      </section>

      <AdminCard title="Ultimas importacoes">
        <div className="mt-5 grid gap-3">
          {runs.map((run) => (
            <article key={run.id} className="grid gap-3 rounded-2xl bg-[var(--blush-50)] p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <strong className="block text-[var(--ink-900)]">{formatStatus(run.status)}</strong>
                <span className="text-sm text-[var(--ink-500)]">
                  {new Date(run.started_at).toLocaleString("pt-BR")} - {run.products_imported}/{run.products_seen} produtos
                </span>
              </div>
              <AdminBadge>
                {run.images_uploaded}/{run.images_seen} imagens
              </AdminBadge>
              <AdminBadge tone={run.errors.length ? "critical" : "success"}>
                {run.errors.length ? `${run.errors.length} erro(s)` : "sem erros"}
              </AdminBadge>
            </article>
          ))}
          {!runs.length ? <AdminEmptyState title="Nenhuma importacao registrada" text="Use o importador para gravar o primeiro snapshot do catalogo." /> : null}
        </div>
      </AdminCard>
    </AdminPage>
  );
}

function StatusMessage({ status, products, images }: { status?: string; products?: string; images?: string }) {
  if (!status) return null;
  const messages: Record<string, { className: string; text: string }> = {
    imported: {
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
      text: `Catalogo importado. Produtos: ${products || "0"}. Imagens: ${images || "0"}.`,
    },
    partial: {
      className: "border-amber-200 bg-amber-50 text-amber-900",
      text: `Importacao parcial. Produtos: ${products || "0"}. Imagens: ${images || "0"}. Veja erros no historico.`,
    },
    "missing-service-role": {
      className: "border-amber-200 bg-amber-50 text-amber-900",
      text: "SUPABASE_SERVICE_ROLE_KEY nao configurada no servidor.",
    },
    error: {
      className: "border-red-200 bg-red-50 text-red-800",
      text: "Nao foi possivel importar agora. Confira Supabase, schema e conectividade com a API Mercos.",
    },
  };
  const message = messages[status];
  if (!message) return null;
  return <p className={`admin-status-message ${message.className}`}>{message.text}</p>;
}

function Check({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--blush-50)] p-3">
      <span className="text-[var(--mint-ink)]">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function formatStatus(status: string) {
  if (status === "completed") return "Concluida";
  if (status === "failed") return "Falhou";
  return "Em andamento";
}
