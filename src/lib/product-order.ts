/**
 * Orden "recomendado" de los productos.
 *
 * Objetivo: que lo primero que vea el cliente sean los iPhone más nuevos.
 *
 *   1) iPhone con stock, del modelo más nuevo al más antiguo
 *      (17 Pro Max → 17 Pro → 17 → 16 Pro Max → …)
 *   2) Resto de productos con stock (destacados, ofertas y más stock primero)
 *   3) iPhone agotados
 *   4) Resto de productos agotados
 *
 * El modelo se lee del NOMBRE del producto, así que al subir un
 * "iPhone 18 Pro Max" aparece solo arriba, sin importar cuándo lo subas.
 */

type OrderableProduct = {
  id: number;
  name: string;
  category: string;
  price: number;
  salePrice?: number | null;
  featured?: boolean;
  stock: number;
  reservedStock: number;
  available?: boolean;
  visible?: boolean;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** ¿Es un iPhone? (un case "para iPhone 15" NO cuenta: su nombre no empieza con iPhone) */
export function isIphone(product: Pick<OrderableProduct, "name" | "category">) {
  return (
    /iphone/.test(normalize(product.category)) ||
    /^\s*iphone\b/.test(normalize(product.name))
  );
}

function getGeneration(name: string) {
  const text = normalize(name);
  const numbered = text.match(/iphone\s*(\d{1,2})/);

  if (numbered) {
    return Number(numbered[1]);
  }

  // iPhone X, XS, XR = generación 10
  if (/iphone\s*x[sr]?\b/.test(text)) {
    return 10;
  }

  // iPhone SE y modelos sin número: al final de los iPhone
  return 0;
}

function getTier(name: string) {
  const compact = normalize(name).replace(/\s+/g, "");

  if (compact.includes("promax")) return 6;
  if (compact.includes("pro")) return 5;
  if (/iphone\d{1,2}air|air/.test(compact)) return 4;
  if (compact.includes("plus")) return 3;
  if (compact.includes("mini") || /iphone\d{1,2}e(?![a-z])/.test(compact)) {
    return 1;
  }

  return 2;
}

function getCapacityGb(name: string) {
  const match = normalize(name).match(/(\d+)\s*(gb|tb)/);

  if (!match) return 0;

  return Number(match[1]) * (match[2] === "tb" ? 1024 : 1);
}

function getAvailableStock(product: OrderableProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

function isInStock(product: OrderableProduct) {
  return (
    product.available !== false &&
    product.visible !== false &&
    getAvailableStock(product) > 0
  );
}

export function compareRecommended(a: OrderableProduct, b: OrderableProduct) {
  const aStock = isInStock(a);
  const bStock = isInStock(b);
  const aPhone = isIphone(a);
  const bPhone = isIphone(b);

  // Orden de los grupos: iPhone con stock, otros con stock, iPhone agotados, otros agotados
  const rank = (inStock: boolean, phone: boolean) =>
    inStock ? (phone ? 0 : 1) : phone ? 2 : 3;

  const rankA = rank(aStock, aPhone);
  const rankB = rank(bStock, bPhone);

  if (rankA !== rankB) {
    return rankA - rankB;
  }

  if (aPhone) {
    // Dentro de los iPhone: modelo más nuevo, luego versión (Pro Max → base), luego capacidad
    const generation = getGeneration(b.name) - getGeneration(a.name);
    if (generation !== 0) return generation;

    const tier = getTier(b.name) - getTier(a.name);
    if (tier !== 0) return tier;

    const capacity = getCapacityGb(b.name) - getCapacityGb(a.name);
    if (capacity !== 0) return capacity;

    return b.id - a.id;
  }

  // Resto de productos: destacados, luego ofertas, luego con más stock, luego los más nuevos
  if (Boolean(a.featured) !== Boolean(b.featured)) {
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  }

  if (a.salePrice && !b.salePrice) return -1;
  if (!a.salePrice && b.salePrice) return 1;

  const stock = getAvailableStock(b) - getAvailableStock(a);
  if (stock !== 0) return stock;

  return b.id - a.id;
}

export function sortRecommended<T extends OrderableProduct>(products: T[]) {
  return [...products].sort(compareRecommended);
}
