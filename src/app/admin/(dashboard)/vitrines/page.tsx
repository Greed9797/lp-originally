import { getHomeSlots, getProducts } from "@/lib/data";
import { saveHomeSlotsAction } from "../../actions";
import { AdminBadge, AdminCard, AdminEmptyState, AdminPage } from "../../admin-components";
import { formatPrice } from "@/lib/format";

const positions = [
  ["hero", "Hero"],
  ["destaques", "Destaques"],
  ["novidades", "Novidades"],
  ["colecao", "Colecao"],
] as const;

export default async function SlotsAdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [params, products, slots] = await Promise.all([searchParams, getProducts(true), getHomeSlots()]);
  const activeByPosition = new Map(positions.map(([key]) => [key, slots.filter((slot) => slot.position === key).map((slot) => slot.product_id)]));
  return (
    <AdminPage eyebrow="Landing" title="Vitrines por posicao" description="Selecione produtos visualmente e defina a ordem que aparece em cada bloco da home.">
      {params.status === "saved" ? <p className="admin-status-message admin-status-success">Vitrines salvas.</p> : null}
      <form action={saveHomeSlotsAction} className="admin-slots-form">
        {positions.map(([key, label]) => {
          const selected = activeByPosition.get(key) || [];
          return (
            <AdminCard key={key} title={label} description={`Produtos escolhidos para a posicao ${label.toLowerCase()}.`}>
              <div className="slot-summary">
                <AdminBadge tone={selected.length ? "success" : "warning"}>{selected.length} selecionado(s)</AdminBadge>
              </div>
              {products.length ? (
                <div className="admin-product-selector">
                  {products.map((product) => {
                    const isChecked = selected.includes(product.id);
                    const order = selected.indexOf(product.id);
                    return (
                      <label key={`${key}-${product.id}`} className="admin-selector-card">
                        <input type="checkbox" name={`${key}[]`} value={product.id} defaultChecked={isChecked} />
                        {product.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.images[0].url} alt={product.images[0].alt || product.name} />
                        ) : (
                          <span className="admin-selector-placeholder">IMG</span>
                        )}
                        <span className="admin-selector-copy">
                          <strong>{product.name}</strong>
                          <small>{product.category?.name || "Sem categoria"} · {product.price_cents > 0 ? formatPrice(product.price_cents) : "Sob consulta"}</small>
                        </span>
                        <span className="admin-selector-order">
                          <small>Ordem</small>
                          <input
                            name={`${key}_order_${product.id}`}
                            type="number"
                            defaultValue={order >= 0 ? order : 99}
                            min="0"
                            aria-label={`Ordem de ${product.name} em ${label}`}
                          />
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <AdminEmptyState title="Nenhum produto disponivel" text="Cadastre produtos antes de montar vitrines." />
              )}
            </AdminCard>
          );
        })}
        <div className="admin-save-bar">
          <span>As alteracoes atualizam a home imediatamente apos salvar.</span>
          <button className="btn btn-mint">Salvar vitrines</button>
        </div>
      </form>
    </AdminPage>
  );
}
