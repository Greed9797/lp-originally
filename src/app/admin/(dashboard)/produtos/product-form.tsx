import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, BadgeCheck, Box, ImageIcon, MessageCircle, PackageCheck, Save, Trash2 } from "lucide-react";
import { deleteProductAction, saveProductAction } from "../../actions";
import type { Category, Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { VariantEditor } from "./variant-editor";
import { ImageManager } from "./image-manager";

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  return (
    <div className="shopify-admin-page">
      <div className="shopify-page-bar">
        <div>
          <Link href="/admin/produtos" className="admin-back-link">
            <ArrowLeft size={16} />
            Produtos
          </Link>
          <h1>{product ? product.name : "Novo produto"}</h1>
          <p>{product ? "Edite conteudo, midia, organizacao e variacoes do produto." : "Cadastre o produto primeiro; depois a galeria de imagens fica disponivel."}</p>
        </div>
        <div className="shopify-page-actions">
          {product ? (
            <Link href={`/produto/${product.slug}`} className="btn btn-ghost text-sm" target="_blank">
              Ver pagina
            </Link>
          ) : null}
          <button className="btn btn-mint text-sm" form="product-form" type="submit">
            <Save size={17} />
            Salvar produto
          </button>
        </div>
      </div>

      <div className="shopify-product-layout">
        <form id="product-form" action={saveProductAction} className="shopify-product-main">
          <input type="hidden" name="id" value={product?.id || ""} />

          <section className="shopify-card">
            <CardTitle icon={<Box size={18} />} title="Informacoes do produto" text="Conteudo principal que aparece na landing, categorias e pagina do produto." />
            <div className="mt-5 grid gap-5">
              <label className="admin-field">
                <span>Titulo</span>
                <input className="admin-input admin-input-lg" name="name" defaultValue={product?.name} placeholder="Ex: Peitoral Toffee Comfort" required />
              </label>
              <label className="admin-field">
                <span>Descricao</span>
                <textarea className="admin-input min-h-36" name="description" defaultValue={product?.description} placeholder="Detalhe material, caimento, acabamento e indicacao de uso." required />
              </label>
              <label className="admin-field">
                <span>Resumo da vitrine</span>
                <input className="admin-input" name="short_description" defaultValue={product?.short_description || ""} placeholder="Texto curto para cards e colecoes" />
              </label>
            </div>
          </section>

          <section className="shopify-card">
            <CardTitle icon={<BadgeCheck size={18} />} title="Preco e status comercial" text="Defina o preco base, badge de vitrine e se o produto aparece publicado." />
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="admin-field">
                <span>Preco base</span>
                <input className="admin-input" name="price" defaultValue={product ? formatPrice(product.price_cents).replace("R$", "").trim() : ""} placeholder="189,90" required />
              </label>
              <label className="admin-field">
                <span>Status</span>
                <select className="admin-input" name="status" defaultValue={product?.status || "draft"}>
                  <option value="draft">Rascunho</option>
                  <option value="published">Publicado</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Badge</span>
                <input className="admin-input" name="badge" defaultValue={product?.badge || ""} placeholder="Top vendas, Novidade..." />
              </label>
              <label className="admin-field">
                <span>URL / slug</span>
                <input className="admin-input" name="slug" defaultValue={product?.slug} placeholder="gerado automaticamente pelo titulo" />
              </label>
            </div>
          </section>

          <VariantEditor variants={product?.variants || []} />

          <section className="shopify-card">
            <CardTitle icon={<MessageCircle size={18} />} title="Venda pelo WhatsApp" text="Mensagem opcional para substituir a mensagem padrao deste produto." />
            <label className="admin-field mt-5">
              <span>Mensagem customizada</span>
              <textarea className="admin-input min-h-28" name="whatsapp_message" defaultValue={product?.whatsapp_message || ""} placeholder="Oi! Quero comprar este produto..." />
            </label>
          </section>

          {product ? (
            <section className="shopify-card danger-card">
              <CardTitle icon={<Trash2 size={18} />} title="Zona de risco" text="Excluir remove o produto do admin e das vitrines publicas." />
              <button formAction={deleteProductAction} className="btn bg-red-100 text-red-700" type="submit">
                Excluir produto
              </button>
            </section>
          ) : null}
        </form>

        <aside className="shopify-product-aside">
          {product ? <ImageManager productId={product.id} images={product.images} /> : <LockedMediaCard />}

          <section className="shopify-card">
            <CardTitle icon={<PackageCheck size={18} />} title="Organizacao" text="Use como no Shopify: status, categoria, canais e destaque controlam onde o produto aparece." />
            <div className="mt-5 grid gap-5">
              <label className="admin-field">
                <span>Categoria</span>
                <select className="admin-input" name="category_id" form="product-form" defaultValue={product?.category_id || ""}>
                  <option value="">Sem categoria</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="shopify-toggle">
                <input type="checkbox" name="featured" form="product-form" defaultChecked={product?.featured} />
                <span>
                  <strong>Destaque automatico</strong>
                  <small>Permite puxar o produto para vitrines quando nao houver slot manual.</small>
                </span>
              </label>
              <div className="shopify-channel-list">
                <span>Landing page</span>
                <span>Pagina de produto</span>
                <span>WhatsApp</span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function CardTitle({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="shopify-card-title">
      <div>{icon}</div>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
    </div>
  );
}

function LockedMediaCard() {
  return (
    <section className="shopify-card">
      <CardTitle icon={<ImageIcon size={18} />} title="Midia do produto" text="Salve o produto para liberar upload de ate 12 imagens." />
      <div className="locked-media">
        <ImageIcon size={34} />
        <p>A galeria fica disponivel automaticamente na tela de edicao depois do primeiro salvamento.</p>
      </div>
    </section>
  );
}
