import type { Category, HomeSlot, Product, SiteSettings } from "./types";

export const sampleCategories: Category[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Roupa", slug: "roupas", description: "Roupas de inverno, sueteres, vestidos e casacos.", sort_order: 1 },
  { id: "22222222-2222-4222-8222-222222222222", name: "Cama", slug: "camas", description: "Camas, tocas, ninhos, mantas e colchonetes.", sort_order: 2 },
  { id: "33333333-3333-4333-8333-333333333333", name: "Passeio", slug: "acessorios", description: "Bolsas, peitorais, guias e itens para a rotina.", sort_order: 3 },
];

const sampleImageUrls = {
  sueter: "https://thumbnails.meuspedidos.com.br/gEtUAt0gZtcYrwa4LuMXPjp_RSQ=/fit-in/400x256/https://arquivos.mercos.com/media/imagem_produto/359510/9b671eca-190d-11f1-b4af-0659bc519464.png",
  cama: "https://thumbnails.meuspedidos.com.br/9yFinHBzb2cPa3z_6WB5Wm2c-Ag=/fit-in/400x256/https://arquivos.mercos.com/media/imagem_produto/359510/419fbf02-498f-11f1-9d54-023b3fb5887d.jpeg",
  bolsa: "https://thumbnails.meuspedidos.com.br/6TJRgbQ_-XSqPcW5g5cPtFWfaWg=/fit-in/400x256/https://arquivos.mercos.com/media/imagem_produto/359510/e5880408-f705-11f0-95f5-3eed6e8c0616.png",
  jaqueta: "https://thumbnails.meuspedidos.com.br/4SlcZne_JvVJ2Nhn6zBPqkodE6c=/fit-in/400x256/https://arquivos.mercos.com/media/imagem_produto/359510/f808875c-fa25-11ef-b853-e61811bc6a33.jpg",
};

export const sampleProducts: Product[] = [
  {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    category_id: sampleCategories[0].id,
    category: sampleCategories[0],
    name: "Sueter ou Vestido Encanto",
    slug: "sueter-vestido-encanto",
    short_description: "Peca da Colecao Patinhas de urso com toque macio e visual delicado.",
    description: "Sueter ou vestido para dias frios, pensado para unir conforto, estilo e liberdade de movimento. A escolha de tamanho considera pescoco, torax e comprimento.",
    price_cents: 18990,
    whatsapp_message: "Ola! Quero o Sueter ou Vestido Encanto da Originally.",
    badge: "Patinhas de urso",
    status: "published",
    featured: true,
    images: [{ id: "img-sueter", product_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", url: sampleImageUrls.sueter, alt: "Sueter ou Vestido Encanto", order_index: 0 }],
    variants: [
      { id: "v1", product_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", size: "P", color: "Bege perola", stock: 8, price_cents: null, active: true },
      { id: "v2", product_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", size: "M", color: "Azul", stock: 5, price_cents: 19990, active: true },
    ],
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    category_id: sampleCategories[1].id,
    category: sampleCategories[1],
    name: "Cama Oval NUVEM BabySoft",
    slug: "cama-oval-nuvem-babysoft",
    short_description: "Couro sintetico por fora, pele BabySoft por dentro e almofada reversivel.",
    description: "Cama oval confortavel e espacosa, com pele BabySoft antistress e termica, enchimento em fibra, fundo em courino contra umidade e ziper para remover o enchimento.",
    price_cents: 24990,
    whatsapp_message: "Ola! Quero a Cama Oval NUVEM BabySoft da Originally.",
    badge: "Novidades 2026",
    status: "published",
    featured: true,
    images: [{ id: "img-cama", product_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", url: sampleImageUrls.cama, alt: "Cama Oval NUVEM BabySoft", order_index: 0 }],
    variants: [
      { id: "v3", product_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", size: "M", color: "Bege/Cinza", stock: 4, price_cents: null, active: true },
      { id: "v7", product_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", size: "G", color: "Marrom/Caramelo", stock: 3, price_cents: 26990, active: true },
    ],
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    category_id: sampleCategories[2].id,
    category: sampleCategories[2],
    name: "Bolsa de Passeio Courvin",
    slug: "bolsa-passeio-courvin",
    short_description: "Bolsa estruturada para saidas, rotina e transporte de pets pequenos.",
    description: "Bolsa de passeio da linha Originally para levar o pet com mais conforto em saidas curtas, visitas e compromissos do dia a dia.",
    price_cents: 12990,
    whatsapp_message: "Ola! Quero a Bolsa de Passeio Courvin da Originally.",
    badge: null,
    status: "published",
    featured: false,
    images: [{ id: "img-bolsa", product_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", url: sampleImageUrls.bolsa, alt: "Bolsa de Passeio Courvin", order_index: 0 }],
    variants: [
      { id: "v4", product_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", size: "Unico", color: "Courvin", stock: 6, price_cents: null, active: true },
    ],
  },
  {
    id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    category_id: sampleCategories[0].id,
    category: sampleCategories[0],
    name: "Jaqueta Corta Vento c/ Sherpa",
    slug: "jaqueta-corta-vento-sherpa",
    short_description: "Protecao leve com toque quentinho para passeios frios.",
    description: "Jaqueta corta vento com sherpa para proteger o pet da friagem, mantendo conforto, praticidade e acabamento alinhado ao catalogo Originally.",
    price_cents: 14990,
    whatsapp_message: "Ola! Quero a Jaqueta Corta Vento c/ Sherpa da Originally.",
    badge: "Novidades 2026",
    status: "published",
    featured: true,
    images: [{ id: "img-jaqueta", product_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", url: sampleImageUrls.jaqueta, alt: "Jaqueta Corta Vento c/ Sherpa", order_index: 0 }],
    variants: [
      { id: "v6", product_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", size: "P", color: "Sherpa", stock: 3, price_cents: null, active: true },
      { id: "v8", product_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", size: "M", color: "Sherpa", stock: 4, price_cents: null, active: true },
    ],
  },
];

export const sampleSettings: SiteSettings = {
  whatsapp_number: "5554996291698",
  whatsapp_default_message: "Ola! Tenho interesse em produtos da Originally.",
  whatsapp_button_label: "Comprar pelo WhatsApp",
};

export const sampleHomeSlots: HomeSlot[] = [
  { id: "h1", position: "hero", product_id: sampleProducts[0].id, sort_order: 1, product: sampleProducts[0] },
  { id: "h2", position: "destaques", product_id: sampleProducts[0].id, sort_order: 1, product: sampleProducts[0] },
  { id: "h3", position: "destaques", product_id: sampleProducts[1].id, sort_order: 2, product: sampleProducts[1] },
  { id: "h4", position: "novidades", product_id: sampleProducts[3].id, sort_order: 1, product: sampleProducts[3] },
  { id: "h5", position: "colecao", product_id: sampleProducts[2].id, sort_order: 1, product: sampleProducts[2] },
];
