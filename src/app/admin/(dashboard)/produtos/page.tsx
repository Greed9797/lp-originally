import Link from "next/link";
import { bulkUpdateProductsAction } from "../../actions";
import { AdminBadge, AdminCard, AdminEmptyState, AdminFilters, AdminIndexTable, AdminPage, AdminSearchInput } from "../../admin-components";
import { getCategories, getProducts } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import { filterAdminProducts, summarizeProductIndex, type ProductFilters, type ProductImageStateFilter, type ProductPriceStateFilter, type ProductSort, type ProductStatusFilter } from "@/lib/admin/products";

const PER_PAGE = 25;

export default async function ProductsAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const [params, products, categories] = await Promise.all([searchParams, getProducts(true), getCategories()]);
  const filters: ProductFilters = {
    query: params.q,
    status: parseStatus(params.status),
    categoryId: params.category || "",
    imageState: parseImageState(params.images),
    priceState: parsePriceState(params.price),
    sort: parseSort(params.sort),
  };
  const filteredProducts = filterAdminProducts(products, filters);
  const summary = summarizeProductIndex(products);
  const page = Math.max(1, Number(params.page || 1));
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const returnTo = buildReturnPath(params);

  return (
    <AdminPage
      eyebrow="Catalogo"
      title="Produtos"
      description="Gerencie catalogo, publicacao, midia e organizacao com uma tabela operacional no estilo Shopify."
      actions={<Link href="/admin/produtos/novo" className="btn btn-mint">Novo produto</Link>}
    >
      <div className="admin-kpi-grid">
        <Kpi label="Total" value={summary.total} />
        <Kpi label="Publicados" value={summary.published} />
        <Kpi label="Sem imagem" value={summary.withoutImages} />
        <Kpi label="Sob consulta" value={summary.withoutPrice} />
      </div>

      <AdminCard>
        <form className="admin-index-toolbar" action="/admin/produtos">
          <AdminSearchInput defaultValue={filters.query || ""} placeholder="Buscar por nome, slug, categoria ou badge" />
          <AdminFilters>
            <label>
              <span>Status</span>
              <select name="status" defaultValue={filters.status || "all"}>
                <option value="all">Todos</option>
                <option value="published">Publicado</option>
                <option value="draft">Rascunho</option>
              </select>
            </label>
            <label>
              <span>Categoria</span>
              <select name="category" defaultValue={filters.categoryId || ""}>
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Imagens</span>
              <select name="images" defaultValue={filters.imageState || "all"}>
                <option value="all">Todas</option>
                <option value="with-images">Com imagem</option>
                <option value="without-images">Sem imagem</option>
              </select>
            </label>
            <label>
              <span>Preco</span>
              <select name="price" defaultValue={filters.priceState || "all"}>
                <option value="all">Todos</option>
                <option value="priced">Com preco</option>
                <option value="consultation">Sob consulta</option>
              </select>
            </label>
            <label>
              <span>Ordenar</span>
              <select name="sort" defaultValue={filters.sort || "created-desc"}>
                <option value="created-desc">Mais recentes</option>
                <option value="name-asc">Nome A-Z</option>
                <option value="name-desc">Nome Z-A</option>
                <option value="price-desc">Maior preco</option>
                <option value="price-asc">Menor preco</option>
              </select>
            </label>
          </AdminFilters>
          <div className="admin-filter-actions">
            <button className="btn btn-dark text-sm" type="submit">Filtrar</button>
            <Link href="/admin/produtos" className="btn btn-ghost text-sm">Limpar</Link>
          </div>
        </form>

        {params.status ? <StatusMessage status={params.status} /> : null}

        <form action={bulkUpdateProductsAction}>
          <input type="hidden" name="return_to" value={returnTo} />
          <div className="admin-bulk-bar">
            <span>{filteredProducts.length} produto(s) encontrados</span>
            <div>
              <button className="btn btn-ghost text-sm" type="submit" name="intent" value="draft">Despublicar selecionados</button>
              <button className="btn btn-mint text-sm" type="submit" name="intent" value="publish">Publicar selecionados</button>
            </div>
          </div>

          <AdminIndexTable>
            {paginatedProducts.length ? (
              <table>
                <thead>
                  <tr>
                    <th className="w-10"><span className="sr-only">Selecionar</span></th>
                    <th>Produto</th>
                    <th>Status</th>
                    <th>Categoria</th>
                    <th>Midia</th>
                    <th className="text-right">Preco</th>
                    <th className="text-right">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => (
                    <tr key={product.id}>
                      <td><input type="checkbox" name="product_id" value={product.id} aria-label={`Selecionar ${product.name}`} /></td>
                      <td>
                        <Link href={`/admin/produtos/${product.id}`} className="admin-product-cell">
                          {product.images[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.images[0].url} alt={product.images[0].alt || product.name} />
                          ) : (
                            <span className="admin-product-placeholder">IMG</span>
                          )}
                          <span>
                            <strong>{product.name}</strong>
                            <small>{product.slug}</small>
                          </span>
                        </Link>
                      </td>
                      <td><AdminBadge tone={product.status === "published" ? "success" : "warning"}>{product.status === "published" ? "Publicado" : "Rascunho"}</AdminBadge></td>
                      <td>{product.category?.name || "Sem categoria"}</td>
                      <td>{product.images.length}/12</td>
                      <td className="text-right font-bold">{product.price_cents > 0 ? formatPrice(product.price_cents) : "Sob consulta"}</td>
                      <td className="text-right">{product.variants.reduce((sum, variant) => sum + variant.stock, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <AdminEmptyState title="Nenhum produto encontrado" text="Ajuste os filtros ou cadastre um novo produto para preencher o catalogo." action={<Link href="/admin/produtos/novo" className="btn btn-mint">Novo produto</Link>} />
            )}
          </AdminIndexTable>
        </form>

        {totalPages > 1 ? (
          <div className="admin-pagination">
            <Link aria-disabled={currentPage <= 1} href={pageHref(params, currentPage - 1)} className="btn btn-ghost text-sm">Anterior</Link>
            <span>Pagina {currentPage} de {totalPages}</span>
            <Link aria-disabled={currentPage >= totalPages} href={pageHref(params, currentPage + 1)} className="btn btn-ghost text-sm">Proxima</Link>
          </div>
        ) : null}
      </AdminCard>
    </AdminPage>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-kpi-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusMessage({ status }: { status: string }) {
  const copy: Record<string, string> = {
    publish: "Produtos selecionados publicados.",
    draft: "Produtos selecionados voltaram para rascunho.",
    "empty-selection": "Selecione ao menos um produto para aplicar a acao em massa.",
  };
  return <p className="admin-status-message">{copy[status] || "Filtro aplicado."}</p>;
}

function parseStatus(value?: string): ProductStatusFilter {
  return value === "published" || value === "draft" ? value : "all";
}

function parseImageState(value?: string): ProductImageStateFilter {
  return value === "with-images" || value === "without-images" ? value : "all";
}

function parsePriceState(value?: string): ProductPriceStateFilter {
  return value === "priced" || value === "consultation" ? value : "all";
}

function parseSort(value?: string): ProductSort {
  if (value === "name-asc" || value === "name-desc" || value === "price-desc" || value === "price-asc") return value;
  return "created-desc";
}

function buildReturnPath(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "status") query.set(key, value);
  });
  const value = query.toString();
  return value ? `/admin/produtos?${value}` : "/admin/produtos";
}

function pageHref(params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "status") query.set(key, value);
  });
  query.set("page", String(Math.max(1, page)));
  return `/admin/produtos?${query.toString()}`;
}
