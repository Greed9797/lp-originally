import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Camera,
  Heart,
  Mail,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { getCategories, getHomeSlots, getProducts, getSettings } from "@/lib/data";
import type { Category, Product, SiteSettings } from "@/lib/types";

export default async function Home() {
  const [settings, products, categories, slots] = await Promise.all([
    getSettings(),
    getProducts(),
    getCategories(),
    getHomeSlots(),
  ]);

  const heroProduct = slots.find((slot) => slot.position === "hero")?.product ?? products[0];
  const collectionProduct = slots.find((slot) => slot.position === "colecao")?.product ?? products[2] ?? products[0];
  const featuredProducts = slots
    .filter((slot) => slot.position === "destaques")
    .map((slot) => slot.product)
    .filter(isProduct)
    .slice(0, 4);
  const newestProducts = slots
    .filter((slot) => slot.position === "novidades")
    .map((slot) => slot.product)
    .filter(isProduct)
    .slice(0, 4);

  const displayFeatured = uniqueProducts([...featuredProducts, ...products.filter((product) => product.featured), ...products]).slice(0, 4);
  const displayNews = uniqueProducts([...newestProducts, ...products]).slice(0, 4);
  const heroGallery = [heroProduct, collectionProduct, ...displayFeatured].filter(isProduct).slice(0, 4);
  const heroBanner = getHeroBanner();

  return (
    <main className="storefront">
      <Hero product={heroProduct} gallery={heroGallery} settings={settings} banner={heroBanner} />
      <Marquee />
      <ProductsSection products={displayFeatured} categories={categories} settings={settings} />
      <CollectionFeature product={collectionProduct} settings={settings} />
      <ProcessSection />
      <ReviewsSection />
      <NewsSection products={displayNews} settings={settings} />
      <InstagramStrip />
      <Newsletter settings={settings} />
    </main>
  );
}

type HeroBannerConfig = {
  imageUrl: string;
  alt: string;
  href?: string;
};

function getHeroBanner(): HeroBannerConfig | null {
  const imageUrl = process.env.NEXT_PUBLIC_HOME_HERO_BANNER_URL?.trim();

  if (!imageUrl) {
    return null;
  }

  return {
    imageUrl,
    alt: process.env.NEXT_PUBLIC_HOME_HERO_BANNER_ALT?.trim() || "Banner Originally Pet",
    href: process.env.NEXT_PUBLIC_HOME_HERO_BANNER_HREF?.trim() || undefined,
  };
}

function Hero({
  product,
  gallery,
  settings,
  banner,
}: {
  product?: Product;
  gallery: Product[];
  settings: SiteSettings;
  banner?: HeroBannerConfig | null;
}) {
  const message = product ? buildProductMessage({ product, settings }) : settings.whatsapp_default_message;

  if (banner) {
    return (
      <section className="container-shell hero hero-banner-mode" aria-label="Originally">
        <FullHeroBanner banner={banner} />
      </section>
    );
  }

  return (
    <section className="container-shell hero" aria-label="Originally">
      <div className="hero-grid">
        <div className="hero-left">
          <span className="eyebrow eyebrow-light">
            <Sparkles size={14} /> Desde 2002
          </span>
          <h1 className="hero-title">
            Conforto pet com fabrica propria e modelagem testada.
          </h1>
          <p className="hero-copy">
            Camas, roupas, peitorais, guias e bolsas feitos pela Originally Pet em Erechim/RS, com foco em qualidade, design, seguranca e liberdade de movimento.
          </p>
          <div className="hero-actions">
            <a href="#produtos" className="btn btn-mint">
              Ver selecionados <ArrowRight size={18} />
            </a>
            <a
              href={buildWhatsAppUrl(settings.whatsapp_number, message)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-soft"
            >
              Comprar pelo WhatsApp
            </a>
          </div>
          <div className="hero-stats">
            <Stat value="2002" label="ano de fundacao" />
            <Stat value="6+" label="linhas de produto" />
            <Stat value="RS" label="sede em Erechim" />
          </div>
        </div>

        <div className="hero-right" aria-label="Galeria Originally">
          {gallery.map((item, index) => (
            <HeroTile key={`${item.id}-${index}`} product={item} large={index === 0} />
          ))}
          {gallery.length < 4 ? <HeroFallback large={gallery.length === 0} /> : null}
          <div className="hero-sticker">
            <PawPrint size={18} />
            sob medida
          </div>
        </div>
      </div>
    </section>
  );
}

function FullHeroBanner({ banner }: { banner: HeroBannerConfig }) {
  const bannerContent = (
    <>
      <span className="sr-only">Originally Pet</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={banner.imageUrl} alt={banner.alt} />
    </>
  );

  if (!banner.href) {
    return <div className="hero-banner">{bannerContent}</div>;
  }

  if (banner.href.startsWith("/")) {
    return (
      <Link href={banner.href} className="hero-banner">
        {bannerContent}
      </Link>
    );
  }

  return (
    <a href={banner.href} target="_blank" rel="noreferrer" className="hero-banner">
      {bannerContent}
    </a>
  );
}

function HeroTile({ product, large }: { product: Product; large?: boolean }) {
  const image = product.images[0];

  return (
    <Link href={`/produto/${product.slug}`} className={large ? "hero-img hero-img-large" : "hero-img"}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt={image.alt || product.name} />
      ) : (
        <span className="hero-placeholder">
          <PawPrint size={large ? 84 : 50} />
        </span>
      )}
      <span className="hero-img-caption">{product.name}</span>
    </Link>
  );
}

function HeroFallback({ large }: { large?: boolean }) {
  return (
    <div className={large ? "hero-img hero-img-large" : "hero-img"}>
      <span className="hero-placeholder">
        <PawPrint size={large ? 84 : 50} />
      </span>
    </div>
  );
}

function Marquee() {
  const items = [
    "fabrica propria desde 2002",
    "camas e tocas",
    "roupas de inverno",
    "peitorais e guias",
    "bolsas de passeio",
    "testes com pets",
    "mascotes personalizados",
  ];

  return (
    <section className="marquee" aria-label="Diferenciais">
      <div className="marquee-track">
        {[...items, ...items].map((item, index) => (
          <span key={`${item}-${index}`}>
            <PawPrint size={16} />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProductsSection({ products, categories, settings }: { products: Product[]; categories: Category[]; settings: SiteSettings }) {
  return (
    <section id="produtos" className="section container-shell">
      <SectionHead
        eyebrow="Catalogo Originally"
        title="Linhas reais para descanso, passeio e inverno."
        copy="A vitrine destaca categorias do catalogo oficial: camas, roupas, bolsas, peitorais, guias, colchonetes, mantas e itens de protecao."
        action={<Link href="/categoria/roupas">Ver todos</Link>}
      />
      <div className="cat-tabs" aria-label="Categorias">
        <a href="#produtos" className="cat-tab active">
          Todos
        </a>
        {categories.slice(0, 4).map((category) => (
          <Link key={category.id} href={`/categoria/${category.slug}`} className="cat-tab">
            {category.name}
          </Link>
        ))}
      </div>
      <div className="products-grid">
        {products.map((product) => (
          <LandingProductCard key={product.id} product={product} settings={settings} />
        ))}
      </div>
    </section>
  );
}

function LandingProductCard({ product, settings }: { product: Product; settings: SiteSettings }) {
  const image = product.images[0];
  const message = buildProductMessage({ product, settings });
  const inStock = product.variants.length === 0 || product.variants.some((variant) => variant.active && variant.stock > 0);

  return (
    <article className="product-card">
      <Link href={`/produto/${product.slug}`} className="product-media">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.url} alt={image.alt || product.name} />
        ) : (
          <span className="product-placeholder">
            <PawPrint size={68} />
          </span>
        )}
        {product.badge ? <span className="product-badge">{product.badge}</span> : null}
        {!inStock ? <span className="product-badge product-badge-dark">Esgotado</span> : null}
        <button type="button" className="favorite-button" aria-label="Favoritar">
          <Heart size={17} />
        </button>
      </Link>
      <div className="product-body">
        <div>
          <span className="product-kicker">{product.category?.name || "Originally"}</span>
          <Link href={`/produto/${product.slug}`}>
            <h3>{product.name}</h3>
          </Link>
          <p>{product.short_description || product.description}</p>
        </div>
        <div className="product-bottom">
          <strong>{formatPrice(product.price_cents)}</strong>
          <a
            href={buildWhatsAppUrl(settings.whatsapp_number, message)}
            target="_blank"
            rel="noreferrer"
            aria-label={`Comprar ${product.name} pelo WhatsApp`}
          >
            <MessageCircle size={18} />
          </a>
        </div>
      </div>
    </article>
  );
}

function CollectionFeature({ product, settings }: { product?: Product; settings: SiteSettings }) {
  const message = product ? buildProductMessage({ product, settings }) : settings.whatsapp_default_message;

  return (
    <section id="colecao" className="container-shell collection-feature">
      <div className="collection-art">
        {product?.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0].url} alt={product.images[0].alt || product.name} />
        ) : (
          <PawPrint size={118} />
        )}
        <span className="float-chip float-chip-one">Erechim RS</span>
        <span className="float-chip float-chip-two">sob medida</span>
      </div>
      <div className="collection-copy">
        <span className="eyebrow">Fabrica propria</span>
        <h2>{product?.name || "Colecao Toffee"}</h2>
        <p>
          A Originally Pet desenvolve produtos para caes e gatos com atencao a materiais, acabamento e seguranca. As pecas sao pensadas para descanso, passeio e rotina, sempre equilibrando conforto, estilo e uso pratico.
        </p>
        <div className="collection-actions">
          {product ? (
            <Link href={`/produto/${product.slug}`} className="btn btn-dark">
              Ver produto <ArrowRight size={18} />
            </Link>
          ) : null}
          <a
            href={buildWhatsAppUrl(settings.whatsapp_number, message)}
            target="_blank"
            rel="noreferrer"
            className="btn btn-ghost"
          >
            Chamar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  const steps = [
    {
      icon: <ShieldCheck size={22} />,
      title: "Escolha a linha",
      text: "Camas, roupas, peitorais, guias, bolsas, colchonetes, mantas e itens de protecao podem ser organizados por colecao.",
    },
    {
      icon: <Sparkles size={22} />,
      title: "Confira medidas",
      text: "Produtos de roupa usam grade por pescoco, torax e comprimento. Quando ficar entre dois tamanhos, a recomendacao e escolher o maior.",
    },
    {
      icon: <MessageCircle size={22} />,
      title: "Atendimento assistido",
      text: "O comprador entra pelo WhatsApp com produto, link e variacao escolhida para confirmar disponibilidade, cor, entrega e condicoes.",
    },
  ];

  return (
    <section id="como-funciona" className="section process-section">
      <div className="container-shell">
        <SectionHead
          eyebrow="Como comprar"
          title="Da escolha ao atendimento, sem friccao."
          copy="A experiencia combina catalogo visual com venda assistida, ideal para confirmar tamanho, cor, disponibilidade e detalhes antes do pedido."
        />
        <div className="process-grid">
          {steps.map((step, index) => (
            <article key={step.title} className="process-card">
              <div className="process-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="process-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  const reviews = [
    {
      text: "As pecas chegam com acabamento caprichado e uma modelagem que respeita o movimento do pet.",
      name: "Cliente lojista",
      role: "Roupas e inverno",
      initials: "CL",
      imageUrl: "",
    },
    {
      text: "A linha de camas facilita montar uma vitrine completa: couro sintetico, pele BabySoft, colchonetes e mantas para todas as estacoes.",
      name: "Curadoria Originally",
      role: "Descanso e decoracao",
      initials: "CO",
      imageUrl: "",
    },
    {
      text: "O atendimento assistido ajuda a confirmar tamanho, cor e disponibilidade antes de fechar o pedido.",
      name: "Atendimento",
      role: "Compra pelo WhatsApp",
      initials: "AT",
      imageUrl: "",
    },
  ];

  return (
    <section id="reviews" className="section container-shell">
      <SectionHead eyebrow="Depoimentos" title="Quem escolhe, nota os detalhes." copy="Fotos reais de pets, clientes ou lojistas podem acompanhar cada relato e deixar a prova social mais humana." />
      <div className="reviews-grid">
        {reviews.map((review) => (
          <article key={review.name} className="review-card">
            <div className="review-media" aria-hidden="true">
              {review.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={review.imageUrl} alt="" />
              ) : (
                <span>{review.initials}</span>
              )}
            </div>
            <div className="stars" aria-label="5 estrelas">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={16} fill="currentColor" />
              ))}
            </div>
            <p>{review.text}</p>
            <strong>{review.name}</strong>
            <small>{review.role}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function NewsSection({ products, settings }: { products: Product[]; settings: SiteSettings }) {
  return (
    <section className="section container-shell">
      <SectionHead eyebrow="Novidades 2026" title="Novas texturas para uma rotina mais aconchegante." copy="Destaques inspirados no catalogo atual: Cama Oval Nuvem, Casaco Teddy, Capa Forrada, Manta Teddy e pecas da Colecao Patinhas de urso." />
      <div className="products-grid products-grid-compact">
        {products.map((product) => (
          <LandingProductCard key={product.id} product={product} settings={settings} />
        ))}
      </div>
    </section>
  );
}

function InstagramStrip() {
  return (
    <section className="container-shell instagram-strip" aria-label="Instagram">
      <div>
        <span className="eyebrow">Instagram</span>
        <h2>Close em tecido, forma e acabamento.</h2>
      </div>
      <div className="insta-tiles">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="insta-tile">
            <Camera size={24} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Newsletter({ settings }: { settings: SiteSettings }) {
  return (
    <section className="container-shell newsletter">
      <div>
        <span className="eyebrow eyebrow-light">Originally Club</span>
        <h2>Receba novidades da fabrica primeiro.</h2>
      </div>
      <a
        href={buildWhatsAppUrl(settings.whatsapp_number, "Oi! Quero receber novidades da Originally.")}
        target="_blank"
        rel="noreferrer"
        className="btn btn-mint"
      >
        <Mail size={18} />
        Entrar na lista
      </a>
    </section>
  );
}

function SectionHead({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="section-side">
        {copy ? <p>{copy}</p> : null}
        {action ? <div className="section-action">{action}</div> : null}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="hero-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function isProduct(product: Product | null | undefined): product is Product {
  return Boolean(product);
}

function uniqueProducts(products: Product[]) {
  return Array.from(new Map(products.map((product) => [product.id, product])).values());
}
