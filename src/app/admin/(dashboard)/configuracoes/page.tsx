import { getSettings } from "@/lib/data";
import { saveSettingsAction } from "../../actions";

export default async function SettingsAdminPage() {
  const settings = await getSettings();
  return (
    <div>
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--mint-ink)]">Site</span>
      <h1 className="brand-display text-5xl text-[var(--toffee-800)]">Configuracoes</h1>
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
