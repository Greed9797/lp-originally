import { getCategories } from "@/lib/data";
import { deleteCategoryAction, saveCategoryAction } from "../../actions";

export default async function CategoriesAdminPage() {
  const categories = await getCategories();
  return (
    <div>
      <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--mint-ink)]">Taxonomia</span>
      <h1 className="brand-display text-5xl text-[var(--toffee-800)]">Categorias</h1>
      <form action={saveCategoryAction} className="mt-8 grid gap-4 rounded-[24px] bg-white p-6 md:grid-cols-[1fr_1fr_0.5fr_auto]">
        <label className="admin-field"><span>Nome</span><input className="admin-input" name="name" required /></label>
        <label className="admin-field"><span>Slug</span><input className="admin-input" name="slug" /></label>
        <label className="admin-field"><span>Ordem</span><input className="admin-input" name="sort_order" type="number" defaultValue="0" /></label>
        <button className="btn btn-mint self-end">Criar</button>
        <label className="admin-field md:col-span-4"><span>Descricao</span><input className="admin-input" name="description" /></label>
      </form>
      <div className="mt-8 grid gap-4">
        {categories.map((category) => (
          <form key={category.id} action={saveCategoryAction} className="grid gap-3 rounded-[22px] bg-white p-5 md:grid-cols-[1fr_1fr_0.5fr_auto_auto]">
            <input type="hidden" name="id" value={category.id} />
            <input className="admin-input" name="name" defaultValue={category.name} />
            <input className="admin-input" name="slug" defaultValue={category.slug} />
            <input className="admin-input" name="sort_order" type="number" defaultValue={category.sort_order} />
            <button className="btn btn-ghost">Salvar</button>
            <button formAction={deleteCategoryAction} className="btn bg-red-100 text-red-700">Excluir</button>
            <input className="admin-input md:col-span-5" name="description" defaultValue={category.description || ""} />
          </form>
        ))}
      </div>
    </div>
  );
}
