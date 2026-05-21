import type { ReactNode } from "react";
import { CloudUpload, Database, ImageIcon, RefreshCw, ShieldCheck } from "lucide-react";
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
    <div>
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--mint-ink)]">Catalogo Mercos</span>
      <h1 className="brand-display text-5xl text-[var(--toffee-800)]">Importacao Originally</h1>
      <p className="mt-2 max-w-3xl text-[var(--ink-500)]">
        Capture produtos, categorias e imagens do catalogo Originally Pet e sincronize tudo no Supabase sem expor chaves no client.
      </p>

      <StatusMessage status={params.status} products={params.products} images={params.images} />

      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
        <form action={runOriginallyImportAction} className="rounded-[24px] bg-white p-6 shadow-[0_12px_30px_rgba(80,40,30,0.06)]">
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

        <section className="rounded-[24px] bg-white p-6 shadow-[0_12px_30px_rgba(80,40,30,0.06)]">
          <h2 className="brand-display text-3xl text-[var(--toffee-800)]">Checklist seguro</h2>
          <div className="mt-5 grid gap-3 text-sm text-[var(--ink-600)]">
            <Check icon={<ShieldCheck size={18} />} text="Service role fica somente no servidor." />
            <Check icon={<Database size={18} />} text="Upsert idempotente por source_id Mercos." />
            <Check icon={<ImageIcon size={18} />} text="Limite de 12 imagens por produto preservado." />
          </div>
        </section>
      </section>

      <section className="mt-8 rounded-[24px] bg-white p-6">
        <h2 className="brand-display text-3xl text-[var(--toffee-800)]">Ultimas importacoes</h2>
        <div className="mt-5 grid gap-3">
          {runs.map((run) => (
            <article key={run.id} className="grid gap-3 rounded-2xl bg-[var(--blush-50)] p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <div>
                <strong className="block text-[var(--ink-900)]">{formatStatus(run.status)}</strong>
                <span className="text-sm text-[var(--ink-500)]">
                  {new Date(run.started_at).toLocaleString("pt-BR")} - {run.products_imported}/{run.products_seen} produtos
                </span>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[var(--toffee-800)]">
                {run.images_uploaded}/{run.images_seen} imagens
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${run.errors.length ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                {run.errors.length ? `${run.errors.length} erro(s)` : "sem erros"}
              </span>
            </article>
          ))}
          {!runs.length ? <p className="text-sm text-[var(--ink-500)]">Nenhuma importacao registrada ainda.</p> : null}
        </div>
      </section>
    </div>
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
  return <p className={`mt-5 rounded-2xl border p-4 text-sm font-bold ${message.className}`}>{message.text}</p>;
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
