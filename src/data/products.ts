export type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number;
  salePrice?: number;
  stock: number;
  reservedStock: number;
  country: "USA" | "China" | "Perú";
  countryFlag: string;
  condition: "Nuevo" | "Open Box" | "Seminuevo";
  tag: string;
  description: string;
  features: string[];
  variants: string[];
    imageUrl?: string;
  gallery?: string[];
  videoUrl?: string;
  wholesale: boolean;
  allowsReservation: boolean;
  invoice: boolean;
};

export const products: Product[] = [
  {
    id: 1,
    name: "iPhone 15 Pro 128GB",
    slug: "iphone-15-pro-128gb",
    category: "iPhones",
    brand: "Apple",
    price: 3899,
    salePrice: 3699,
    stock: 5,
    reservedStock: 1,
    country: "USA",
    countryFlag: "🇺🇸",
    condition: "Nuevo",
    tag: "Destacado",
        imageUrl: "",
    gallery: [],
    description:
      "iPhone importado desde USA, ideal para quienes buscan rendimiento premium, cámara profesional y diseño elegante.",
    features: [
      "Pantalla Super Retina XDR",
      "Chip A17 Pro",
      "Cámara principal de 48 MP",
      "Compatible con carga rápida",
      "Producto verificado por RCA IMPORT",
    ],
    variants: ["Natural Titanium", "Black Titanium", "Blue Titanium"],
    videoUrl: "https://www.youtube.com",
    wholesale: false,
    allowsReservation: true,
    invoice: true,
  },
  {
    id: 2,
    name: "iPhone 13 Pro Max 256GB",
    slug: "iphone-13-pro-max-256gb",
    category: "iPhones",
    brand: "Apple",
    price: 2599,
    stock: 3,
    reservedStock: 0,
    country: "USA",
    countryFlag: "🇺🇸",
    condition: "Open Box",
    tag: "En stock",
        imageUrl: "",
    gallery: [],
    description:
      "Equipo Apple con excelente pantalla, batería de alto rendimiento y cámara profesional. Disponible para compra o separación.",
    features: [
      "Pantalla OLED de gran tamaño",
      "Almacenamiento 256GB",
      "Cámara triple",
      "Ideal para fotografía y video",
      "Incluye revisión previa",
    ],
    variants: ["Graphite", "Sierra Blue", "Gold"],
    wholesale: false,
    allowsReservation: true,
    invoice: true,
  },
  {
    id: 3,
    name: "Cubo 20W Tipo C",
    slug: "cubo-20w-tipo-c",
    category: "Cubos",
    brand: "Apple",
    price: 89,
    salePrice: 75,
    stock: 20,
    reservedStock: 2,
    country: "China",
    countryFlag: "🇨🇳",
    condition: "Nuevo",
    tag: "Oferta",
        imageUrl: "",
    gallery: [],
    description:
      "Cubo de carga rápida ideal para iPhone y dispositivos compatibles con entrada Tipo C.",
    features: [
      "Carga rápida 20W",
      "Entrada Tipo C",
      "Compatible con iPhone",
      "Producto nuevo",
      "Ideal para venta por unidad o mayor",
    ],
    variants: ["Blanco"],
    wholesale: true,
    allowsReservation: true,
    invoice: true,
  },
  {
    id: 4,
    name: "Case MagSafe Transparente",
    slug: "case-magsafe-transparente",
    category: "Cases",
    brand: "RCA Accessories",
    price: 69,
    stock: 15,
    reservedStock: 0,
    country: "China",
    countryFlag: "🇨🇳",
    condition: "Nuevo",
    tag: "Nuevo",
        imageUrl: "",
    gallery: [],
    description:
      "Case transparente compatible con MagSafe, pensado para proteger el iPhone sin perder el diseño original.",
    features: [
      "Compatible con MagSafe",
      "Diseño transparente",
      "Protección contra golpes",
      "Disponible para varios modelos",
      "Venta por unidad y por mayor",
    ],
    variants: ["iPhone 13", "iPhone 14", "iPhone 15", "iPhone 15 Pro"],
    wholesale: true,
    allowsReservation: true,
    invoice: true,
  },
  {
    id: 5,
    name: "Cable Tipo C a Lightning",
    slug: "cable-tipo-c-a-lightning",
    category: "Cables",
    brand: "Apple",
    price: 59,
    stock: 30,
    reservedStock: 4,
    country: "China",
    countryFlag: "🇨🇳",
    condition: "Nuevo",
    tag: "Mayorista",
        imageUrl: "",
    gallery: [],
    description:
      "Cable Tipo C a Lightning para carga rápida de iPhone. Ideal para venta individual o por mayor.",
    features: [
      "Entrada Tipo C",
      "Salida Lightning",
      "Compatible con carga rápida",
      "Ideal para iPhone",
      "Disponible para mayoristas",
    ],
    variants: ["1 metro", "2 metros"],
    wholesale: true,
    allowsReservation: true,
    invoice: true,
  },
  {
    id: 6,
    name: "Apple Watch Serie 8",
    slug: "apple-watch-serie-8",
    category: "Relojes",
    brand: "Apple",
    price: 1299,
    stock: 2,
    reservedStock: 0,
    country: "USA",
    countryFlag: "🇺🇸",
    condition: "Open Box",
    tag: "Premium",
        imageUrl: "",
    gallery: [],
    description:
      "Reloj inteligente Apple importado, ideal para entrenamiento, salud, notificaciones y estilo diario.",
    features: [
      "Pantalla Retina",
      "Funciones de salud",
      "Seguimiento deportivo",
      "Compatible con iPhone",
      "Producto importado",
    ],
    variants: ["Midnight", "Silver"],
    wholesale: false,
    allowsReservation: true,
    invoice: true,
  },
];

export const categories = [
  "Todos",
  "iPhones",
  "Accesorios",
  "Cables",
  "Cubos",
  "Cases",
  "Relojes",
  "Perfumes",
  "Zapatillas",
  "Mayorista",
];

export const categoryItems = [
  {
    name: "iPhones",
    slug: "iphones",
    description:
      "Equipos Apple importados, verificados y disponibles para compra o separación.",
  },
  {
    name: "Accesorios",
    slug: "accesorios",
    description:
      "Accesorios tecnológicos para complementar tus dispositivos.",
  },
  {
    name: "Cables",
    slug: "cables",
    description:
      "Cables de carga y conexión para iPhone, Android y otros dispositivos.",
  },
  {
    name: "Cubos",
    slug: "cubos",
    description:
      "Cargadores, cubos y adaptadores para carga rápida.",
  },
  {
    name: "Cases",
    slug: "cases",
    description:
      "Cases y protectores para distintos modelos de celulares.",
  },
  {
    name: "Relojes",
    slug: "relojes",
    description:
      "Relojes inteligentes y accesorios importados.",
  },
  {
    name: "Perfumes",
    slug: "perfumes",
    description:
      "Perfumes importados que podrán agregarse al catálogo más adelante.",
  },
  {
    name: "Zapatillas",
    slug: "zapatillas",
    description:
      "Zapatillas importadas listas para futuras ventas en RCA IMPORT.",
  },
  {
    name: "Mayorista",
    slug: "mayorista",
    description:
      "Productos disponibles para compras por cantidad y precios especiales.",
  },
];

export function getCategorySlug(categoryName: string) {
  const category = categoryItems.find((item) => item.name === categoryName);
  return category?.slug ?? categoryName.toLowerCase();
}