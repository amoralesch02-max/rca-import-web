import type { PublicProduct } from "@/lib/supabase-products";

/**
 * Descuento por campaña (ej. Black Friday), aplicado solo por un tiempo.
 *
 * - NO cambia los precios guardados en Supabase: el descuento se calcula al
 *   mostrar los productos al cliente. Al terminar la fecha, todo vuelve solo
 *   a los precios normales.
 * - Se aplica al precio general y a cada capacidad (256GB, 512GB, ...).
 * - Si un producto ya tiene una oferta mejor, se respeta la oferta mejor.
 * - El panel admin siempre ve y edita los precios reales (sin la campaña).
 * - En la PC (npm run dev) la campaña se ve desde ya, para poder revisarla.
 *
 * Para otra campaña: cambia las fechas, el % y a qué productos se aplica.
 */
export const CAMPAIGN = {
  name: "Black Friday",
  start: new Date("2026-11-27T00:00:00-05:00"), // viernes 27, 00:00 (hora de Perú)
  end: new Date("2026-12-01T00:00:00-05:00"), // hasta el lunes 30, 23:59
  percent: 10,
};

/** iPhones: por categoría, o productos cuyo nombre empieza con "iPhone" */
export function isIphoneProduct(product: Pick<PublicProduct, "category" | "name">) {
  return (
    /iphone/i.test(product.category ?? "") ||
    /^\s*iphone/i.test(product.name ?? "")
  );
}

/** ¿A qué productos se aplica la campaña? */
function appliesTo(product: PublicProduct) {
  return isIphoneProduct(product);
}

export function isCampaignActive(now = new Date()) {
  const time = now.getTime();

  if (time >= CAMPAIGN.end.getTime()) {
    return false;
  }

  // En desarrollo se ve antes de tiempo para poder revisarla
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return time >= CAMPAIGN.start.getTime();
}

function discounted(price: number) {
  return Math.round(price * (1 - CAMPAIGN.percent / 100));
}

/** Se queda con la oferta más baja (la existente o la de la campaña) */
function bestSale(price: number, currentSale: number | null | undefined) {
  if (!price || price <= 0) {
    return currentSale ?? null;
  }

  const campaignSale = discounted(price);

  return currentSale && currentSale < campaignSale ? currentSale : campaignSale;
}

export function applyCampaign(product: PublicProduct): PublicProduct {
  if (!isCampaignActive() || !appliesTo(product)) {
    return product;
  }

  return {
    ...product,
    salePrice: bestSale(product.price, product.salePrice) ?? undefined,
    storageOptions: product.storageOptions?.map((storage) => ({
      ...storage,
      salePrice: bestSale(storage.price, storage.salePrice),
    })),
  };
}
