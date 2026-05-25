import { AdminCard, AdminEmptyState, AdminPage } from "../../admin-components";
import { getInstagramTiles } from "@/lib/data";
import { saveInstagramTilesAction } from "../../actions";
import { InstagramManager } from "./instagram-manager";

export default async function InstagramAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [params, tiles] = await Promise.all([searchParams, getInstagramTiles(true)]);

  return (
    <AdminPage
      eyebrow="Home"
      title="Instagram"
      description="Cadastre as fotos que aparecem no bloco de Instagram da landing. Use como um CRUD de vitrine visual: enviar, editar, publicar, ordenar e remover."
    >
      {params.status === "saved" ? <p className="admin-status-message admin-status-success">Instagram salvo.</p> : null}

      <AdminCard title="Upload de fotos" description="Envie imagens quadradas ou horizontais em JPEG, PNG ou WebP. O bloco publico usa as primeiras fotos ativas pela ordem.">
        <InstagramManager tiles={tiles} />
      </AdminCard>

      <AdminCard title="Fotos cadastradas" description="Edite texto alternativo, link, ordem e status de publicacao.">
        <form action={saveInstagramTilesAction}>
          <div className="admin-instagram-grid">
            {tiles.length ? (
              tiles.map((tile) => (
                <article key={tile.id} className="admin-instagram-card">
                  <input type="hidden" name="tile_id" value={tile.id} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tile.image_url} alt={tile.alt_text || "Instagram Originally"} />
                  <div className="admin-instagram-fields">
                    <label className="admin-field">
                      <span>Texto alt</span>
                      <input className="admin-input" name={`alt_text_${tile.id}`} defaultValue={tile.alt_text || ""} />
                    </label>
                    <label className="admin-field">
                      <span>Link</span>
                      <input className="admin-input" name={`link_url_${tile.id}`} defaultValue={tile.link_url || ""} placeholder="https://instagram.com/..." />
                    </label>
                    <div className="admin-instagram-row">
                      <label className="admin-field">
                        <span>Ordem</span>
                        <input className="admin-input" name={`sort_order_${tile.id}`} type="number" defaultValue={tile.sort_order} />
                      </label>
                      <label className="shopify-toggle admin-instagram-toggle">
                        <input type="checkbox" name={`active_${tile.id}`} defaultChecked={tile.active} />
                        <span>
                          <strong>Ativa</strong>
                          <small>Aparece na home</small>
                        </span>
                      </label>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <AdminEmptyState title="Nenhuma foto cadastrada" text="Envie imagens no painel acima para substituir os placeholders da landing." />
            )}
          </div>
          <div className="admin-save-bar">
            <span>Salve para atualizar a home.</span>
            <button className="btn btn-mint">Salvar Instagram</button>
          </div>
        </form>
      </AdminCard>
    </AdminPage>
  );
}
