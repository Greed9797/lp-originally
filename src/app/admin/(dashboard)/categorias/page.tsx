import { getCategories } from "@/lib/data";
import { deleteCategoryAction, saveCategoryAction } from "../../actions";
import { AdminCard, AdminEmptyState, AdminIndexTable, AdminPage } from "../../admin-components";

export default async function CategoriesAdminPage() {
  const categories = await getCategories();
  return (
    <AdminPage eyebrow="Taxonomia" title="Categorias" description="Organize colecoes, filtros e paginas publicas por categoria.">
      <AdminCard title="Nova categoria" description="O slug pode ficar em branco para ser gerado pelo nome.">
        <form action={saveCategoryAction} className="admin-form-grid">
          <label className="admin-field"><span>Nome</span><input className="admin-input" name="name" required /></label>
          <label className="admin-field"><span>Slug</span><input className="admin-input" name="slug" /></label>
          <label className="admin-field"><span>Ordem</span><input className="admin-input" name="sort_order" type="number" defaultValue="0" /></label>
          <button className="btn btn-mint self-end">Criar</button>
          <label className="admin-field md:col-span-4"><span>Descricao</span><input className="admin-input" name="description" /></label>
        </form>
      </AdminCard>

      <AdminCard title="Categorias cadastradas">
        <AdminIndexTable className="admin-category-table">
          {categories.length ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Slug</th>
                    <th>Ordem</th>
                    <th>Descricao</th>
                    <th className="text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const formId = `category-${category.id}`;
                    return (
                      <tr key={category.id}>
                        <td>
                          <input className="admin-table-input" form={formId} name="name" defaultValue={category.name} aria-label="Nome" />
                        </td>
                        <td>
                          <input className="admin-table-input" form={formId} name="slug" defaultValue={category.slug} aria-label="Slug" />
                        </td>
                        <td>
                          <input className="admin-table-input admin-table-input-sm" form={formId} name="sort_order" type="number" defaultValue={category.sort_order} aria-label="Ordem" />
                        </td>
                        <td>
                          <input className="admin-table-input" form={formId} name="description" defaultValue={category.description || ""} aria-label="Descricao" />
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button className="btn btn-ghost text-sm" form={formId}>Salvar</button>
                            <button className="btn bg-red-100 text-sm text-red-700" form={formId} formAction={deleteCategoryAction}>Excluir</button>
                          </div>
                          <form id={formId} action={saveCategoryAction}>
                            <input type="hidden" name="id" value={category.id} />
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          ) : (
            <AdminEmptyState title="Nenhuma categoria" text="Crie categorias para montar colecoes, filtros e vitrines com mais controle." />
          )}
        </AdminIndexTable>
      </AdminCard>
    </AdminPage>
  );
}
