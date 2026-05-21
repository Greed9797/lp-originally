import { getSettings } from "@/lib/data";
import { saveSettingsAction } from "../../actions";

export default async function SettingsAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const settings = await getSettings();
  return (
    <div>
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--mint-ink)]">Site</span>
      <h1 className="brand-display text-5xl text-[var(--toffee-800)]">Configuracoes</h1>
      {params.status === "saved" ? (
        <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          Configuracoes salvas.
        </p>
      ) : null}
      {params.status === "supabase-schema" ? (
        <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          O admin esta autenticado, mas o Supabase ainda nao esta expondo a tabela site_settings na Data API. Rode o reload schema no Supabase para ativar a persistencia.
        </p>
      ) : null}
      {params.status === "error" ? (
        <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          Nao foi possivel salvar agora. Tente novamente depois de conferir as configuracoes do Supabase.
        </p>
      ) : null}
      <form action={saveSettingsAction} className="mt-8 grid max-w-3xl gap-5 rounded-[24px] bg-white p-6">
        <label className="admin-field">
          <span>Numero do WhatsApp</span>
          <input className="admin-input" name="whatsapp_number" defaultValue={settings.whatsapp_number} placeholder="5511999999999" />
        </label>
        <label className="admin-field">
          <span>Mensagem padrao</span>
          <textarea className="admin-input min-h-28" name="whatsapp_default_message" defaultValue={settings.whatsapp_default_message} />
        </label>
        <label className="admin-field">
          <span>Texto do botao</span>
          <input className="admin-input" name="whatsapp_button_label" defaultValue={settings.whatsapp_button_label} />
        </label>
        <button className="btn btn-mint justify-self-start">Salvar configuracoes</button>
      </form>
    </div>
  );
}
