import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Camera,
  Heart,
  Mail,
  MessageCircle,
  PawPrint,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { WhatsAppFloating } from "@/components/whatsapp-floating";
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
  const homeHeroBannerUrl = process.env.NEXT_PUBLIC_HOME_HERO_BANNER_URL?.trim();
  const homeHeroBannerAlt = process.env.NEXT_PUBLIC_HOME_HERO_BANNER_ALT?.trim() || "Colecao Toffee Originally Pet";
  const homeHeroBannerHref = process.env.NEXT_PUBLIC_HOME_HERO_BANNER_HREF?.trim() || "#produtos";

  return (
    <main className="storefront">
      <PromoBar />
      <SiteNav settings={settings} />
      {homeHeroBannerUrl ? (
        <HomeHeroBanner src={homeHeroBannerUrl} alt={homeHeroBannerAlt} href={homeHeroBannerHref} settings={settings} />
      ) : (
        <Hero product={heroProduct} gallery={heroGallery} settings={settings} />
      )}
      <Marquee />
      <ProductsSection products={displayFeatured} categories={categories} settings={settings} />
      <CollectionFeature product={collectionProduct} settings={settings} />
      <ProcessSection />
      <ReviewsSection />
      <NewsSection products={displayNews} settings={settings} />
      <InstagramStrip />
      <Newsletter settings={settings} />
      <StoreFooter settings={settings} />
      <WhatsAppFloating settings={settings} />
    </main>
  );
}

function HomeHeroBanner({ src, alt, href, settings }: { src: string; alt: string; href: string; settings: SiteSettings }) {
  return (
    <section className="home-hero-banner" aria-label="Colecao Originally">
      <a className="home-hero-banner-link" href={href}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} />
      </a>
      <a
        href={buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_default_message)}
        target="_blank"
        rel="noreferrer"
        className="home-hero-whatsapp"
      >
        Comprar pelo WhatsApp <ArrowRight size={18} />
      </a>
    </section>
  );
}

function PromoBar() {
  return (
    <div className="promo-bar">
      <span>Frete gratis Brasil acima de R$ 299</span>
      <span className="promo-dot" />
      <span>Bordado personalizado em pequenos lotes</span>
    </div>
  );
}

function SiteNav({ settings }: { settings: SiteSettings }) {
  return (
    <header className="site-header">
      <div className="container-shell site-nav">
        <Link href="/" className="brand-lockup" aria-label="Originally home">
          originally
        </Link>
        <nav className="nav-links" aria-label="Principal">
          <a href="#produtos">Shop</a>
          <a href="#colecao">Colecao</a>
          <a href="#como-funciona">Atelie</a>
          <a href="#reviews">Reviews</a>
        </nav>
        <div className="nav-actions">
          <button className="icon-button" aria-label="Buscar produtos" type="button">
            <Search size={18} />
          </button>
          <a
            className="icon-button"
            href={buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_default_message)}
            target="_blank"
            rel="noreferrer"
            aria-label="Comprar pelo WhatsApp"
          >
            <MessageCircle size={18} />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero({ product, gallery, settings }: { product?: Product; gallery: Product[]; settings: SiteSettings }) {
  const message = product ? buildProductMessage({ product, settings }) : settings.whatsapp_default_message;

  return (
    <section className="container-shell hero" aria-label="Originally">
      <div className="hero-grid">
        <div className="hero-left">
          <span className="eyebrow eyebrow-light">
            <Sparkles size={14} /> Nova colecao
          </span>
          <h1 className="hero-title">
            Tudo pro seu pet com aconchego e protecao.
          </h1>
          <p className="hero-copy">
            Peitorais, roupinhas e acessorios feitos em pequenos lotes, com acabamentos delicados e compra assistida pelo WhatsApp.
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
            <Stat value="feito" label="em pequenos lotes" />
            <Stat value="4.9" label="media de reviews" />
            <Stat value="12" label="imagens por produto" />
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
  const items = ["aconchego e protecao", "embalagem reutilizavel", "bordado personalizado", "frete gratis Brasil", "feito a mao em pequenos lotes"];

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
        eyebrow="Selecionados"
        title="Produtos com cara de presente."
        copy="Escolha a peca, confirme tamanho e cor no produto e finalize a compra direto no WhatsApp."
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
        <span className="float-chip float-chip-one">toffee</span>
        <span className="float-chip float-chip-two">menta</span>
      </div>
      <div className="collection-copy">
        <span className="eyebrow">Colecao editavel</span>
        <h2>{product?.name || "Colecao Toffee"}</h2>
        <p>
          Use a vitrine do admin para escolher qual produto entra no hero, destaques, novidades e nesta colecao. A landing continua com cara de loja boutique, mas o conteudo fica editavel.
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
      title: "Escolha a peca",
      text: "Produtos publicados aparecem na home, categorias e pagina individual.",
    },
    {
      icon: <Sparkles size={22} />,
      title: "Defina tamanho e cor",
      text: "Quando houver variacao, a pagina exige a selecao antes de abrir o WhatsApp.",
    },
    {
      icon: <MessageCircle size={22} />,
      title: "Finalize no WhatsApp",
      text: "A mensagem leva produto, preco, link e variacao escolhida para atendimento rapido.",
    },
  ];

  return (
    <section id="como-funciona" className="section process-section">
      <div className="container-shell">
        <SectionHead
          eyebrow="Atelie"
          title="Pedido sob medida, entregue com mimo."
          copy="O fluxo segue enxuto: sem carrinho e sem checkout por enquanto, tudo pronto para conversa e venda assistida."
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
    ["Ajuste perfeito e atendimento muito cuidadoso.", "Luna"],
    ["A embalagem parece presente e a peca ficou linda.", "Maya"],
    ["Comprei pelo WhatsApp em poucos minutos.", "Nina"],
  ];

  return (
    <section id="reviews" className="section container-shell">
      <SectionHead eyebrow="Reviews" title="Vozes da nossa matilha." />
      <div className="reviews-grid">
        {reviews.map(([text, name]) => (
          <article key={name} className="review-card">
            <div className="stars" aria-label="5 estrelas">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={16} fill="currentColor" />
              ))}
            </div>
            <p>{text}</p>
            <strong>{name}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function NewsSection({ products, settings }: { products: Product[]; settings: SiteSettings }) {
  return (
    <section className="section container-shell">
      <SectionHead eyebrow="Novidades" title="Lancamentos e reposicoes." copy="Uma segunda vitrine para produtos novos, reposicoes ou colecoes sazonais." />
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
        <h2>Detalhes que aparecem no close.</h2>
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
        <h2>Receba reposicoes e novidades primeiro.</h2>
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

function StoreFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="store-footer">
      <div className="container-shell footer-grid">
        <div>
          <Link href="/" className="brand-lockup footer-brand">
            originally
          </Link>
          <p>Aconchego e protecao para pets, com curadoria visual e compra assistida pelo WhatsApp.</p>
        </div>
        <div className="footer-links">
          <a href="#produtos">Shop</a>
          <a href="#colecao">Colecao</a>
          <a href="#como-funciona">Atelie</a>
          <Link href="/admin">Admin</Link>
        </div>
        <a
          href={buildWhatsAppUrl(settings.whatsapp_number, settings.whatsapp_default_message)}
          target="_blank"
          rel="noreferrer"
          className="btn btn-mint"
        >
          {settings.whatsapp_button_label}
        </a>
      </div>
    </footer>
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
