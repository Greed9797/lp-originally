import { getHomeSlots, getProducts } from "@/lib/data";
import { saveHomeSlotsAction } from "../../actions";

const positions = [
  ["hero", "Hero"],
  ["destaques", "Destaques"],
  ["novidades", "Novidades"],
  ["colecao", "Colecao"],
] as const;

export default async function SlotsAdminPage() {
  const [products, slots] = await Promise.all([getProducts(true), getHomeSlots()]);
  return (
    <div>
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--mint-ink)]">Landing</span>
      <h1 className="brand-display text-5xl text-[var(--toffee-800)]">Vitrines por posicao</h1>
      <p className="mt-2 max-w-2xl text-[var(--ink-500)]">Informe IDs de produtos separados por virgula para controlar onde cada produto aparece na home.</p>
      <form action={saveHomeSlotsAction} className="mt-8 grid gap-5 rounded-[24px] bg-white p-6">
        {positions.map(([key, label]) => (
          <label key={key} className="admin-field">
            <span>{label}</span>
            <input className="admin-input" name={key} defaultValue={slots.filter((slot) => slot.position === key).map((slot) => slot.product_id).join(",")} />
          </label>
        ))}
        <button className="btn btn-mint justify-self-start">Salvar vitrines</button>
      </form>
      <section className="mt-8 rounded-[24px] bg-white p-6">
        <h2 className="brand-display text-3xl text-[var(--toffee-800)]">Produtos disponiveis</h2>
        <div className="mt-4 grid gap-2">
          {products.map((product) => (
            <div key={product.id} className="rounded-2xl bg-[var(--blush-50)] p-3 text-sm">
              <strong>{product.name}</strong>
              <span className="ml-3 text-[var(--ink-500)]">{product.id}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
