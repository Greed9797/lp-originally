import { getSettings } from "@/lib/data";
import { saveSettingsAction } from "../../actions";
import { AdminCard, AdminPage } from "../../admin-components";

export default async function SettingsAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const settings = await getSettings();
  return (
    <AdminPage eyebrow="Site" title="Configuracoes" description="Controle os CTAs de WhatsApp e mensagens padrao da loja.">
      {params.status === "saved" ? (
        <p className="admin-status-message admin-status-success">
          Configuracoes salvas.
        </p>
      ) : null}
      {params.status === "supabase-schema" ? (
        <p className="admin-status-message admin-status-warning">
          O admin esta autenticado, mas o Supabase ainda nao esta expondo a tabela site_settings na Data API. Rode o reload schema no Supabase para ativar a persistencia.
        </p>
      ) : null}
      {params.status === "error" ? (
        <p className="admin-status-message admin-status-critical">
          Nao foi possivel salvar agora. Tente novamente depois de conferir as configuracoes do Supabase.
        </p>
      ) : null}
      <AdminCard title="WhatsApp" description="Use apenas numero com codigo do pais ou URL api.whatsapp.com; o sistema normaliza antes de abrir conversa.">
        <form action={saveSettingsAction} className="admin-settings-form">
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
      </AdminCard>
    </AdminPage>
  );
}
