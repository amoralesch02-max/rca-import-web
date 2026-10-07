/**
 * Colores (con imágenes) y capacidades (con precio) de un producto.
 * Se guardan en la tabla products como JSON: color_options y storage_options.
 */

export type ColorOption = {
  name: string;
  /** Color de la bolita, ej. "#e8742a". Si va vacío se deduce del nombre. */
  hex: string;
  /** Fotos de este color (la primera es la que se muestra al elegirlo) */
  images: string[];
};

export type StorageOption = {
  /** Ej. "256GB" */
  label: string;
  price: number;
  /** Precio de oferta de esta capacidad (opcional) */
  salePrice: number | null;
};

type ProductOptionsSource = {
  price: number;
  salePrice?: number | null;
  variants?: string[];
  colorOptions?: ColorOption[];
  storageOptions?: StorageOption[];
};

/* ---------- Colores: bolita según el nombre ---------- */

const COLOR_GUESSES: [string[], string][] = [
  [["natural", "titanio natural"], "#bfb5a6"],
  [["desierto", "desert"], "#c9a27e"],
  [["negro", "black", "space", "medianoche", "midnight", "grafito"], "#1d1d1f"],
  [["blanco", "white", "starlight", "estelar"], "#f2f2f2"],
  [["plata", "silver"], "#d9dadc"],
  [["gris", "gray", "grey"], "#8a8a8e"],
  [["azul", "blue", "sierra", "pacifico", "pacific"], "#3b5b8c"],
  [["naranja", "orange", "cosmic", "cosmico"], "#e8742a"],
  [["rosa", "pink", "rose"], "#f4c2c2"],
  [["verde", "green", "teal", "menta"], "#4f7a5a"],
  [["amarillo", "yellow"], "#f5e27a"],
  [["morado", "purple", "violeta", "lavanda", "lavender"], "#b9a2d6"],
  [["dorado", "gold", "oro"], "#d9bf8f"],
  [["rojo", "red", "product"], "#c62828"],
];

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function guessColorHex(name: string) {
  const clean = normalize(name);

  for (const [keywords, hex] of COLOR_GUESSES) {
    if (keywords.some((keyword) => clean.includes(keyword))) {
      return hex;
    }
  }

  return "#cbd5e1";
}

export function getColorHex(color: Pick<ColorOption, "name" | "hex">) {
  return color.hex?.trim() || guessColorHex(color.name);
}

/* ---------- Lectura segura desde la base de datos ---------- */

export function parseColorOptions(raw: unknown): ColorOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      const value = (item ?? {}) as Record<string, unknown>;

      return {
        name: typeof value.name === "string" ? value.name.trim() : "",
        hex: typeof value.hex === "string" ? value.hex.trim() : "",
        images: Array.isArray(value.images)
          ? value.images.filter(
              (image): image is string =>
                typeof image === "string" && image.trim() !== ""
            )
          : [],
      };
    })
    .filter((color) => color.name !== "");
}

export function parseStorageOptions(raw: unknown): StorageOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      const value = (item ?? {}) as Record<string, unknown>;
      const price = Number(value.price);
      const salePrice =
        value.salePrice === null ||
        value.salePrice === undefined ||
        value.salePrice === ""
          ? null
          : Number(value.salePrice);

      return {
        label: typeof value.label === "string" ? value.label.trim() : "",
        price: Number.isFinite(price) ? price : 0,
        salePrice:
          salePrice !== null && Number.isFinite(salePrice) && salePrice > 0
            ? salePrice
            : null,
      };
    })
    .filter((storage) => storage.label !== "" && storage.price > 0);
}

/* ---------- Uso en la tienda ---------- */

/** Colores del producto. Si solo tiene la lista antigua de nombres, la convierte. */
export function getProductColors(product: ProductOptionsSource): ColorOption[] {
  if (product.colorOptions && product.colorOptions.length > 0) {
    return product.colorOptions;
  }

  return (product.variants ?? [])
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, hex: "", images: [] }));
}

export function getProductStorages(
  product: ProductOptionsSource
): StorageOption[] {
  return product.storageOptions ?? [];
}

/** Precio según la capacidad elegida (o el precio general si no hay capacidades) */
export function getStoragePricing(
  product: ProductOptionsSource,
  storageIndex: number
) {
  const storages = getProductStorages(product);

  if (storages.length === 0) {
    const sale =
      product.salePrice && product.salePrice < product.price
        ? product.salePrice
        : null;

    return {
      price: product.price,
      salePrice: sale,
      final: sale ?? product.price,
    };
  }

  const storage = storages[Math.min(Math.max(storageIndex, 0), storages.length - 1)];
  const sale =
    storage.salePrice && storage.salePrice < storage.price
      ? storage.salePrice
      : null;

  return {
    price: storage.price,
    salePrice: sale,
    final: sale ?? storage.price,
  };
}

/** Precio "Desde" para las tarjetas */
export function getStartingPrice(product: ProductOptionsSource) {
  const storages = getProductStorages(product);

  if (storages.length > 1) {
    const finals = storages.map((_, index) =>
      getStoragePricing(product, index).final
    );

    return {
      final: Math.min(...finals),
      hasRange: new Set(finals).size > 1,
    };
  }

  return {
    final: getStoragePricing(product, 0).final,
    hasRange: false,
  };
}

/** Texto que se guarda en el carrito, ej. "Negro · 256GB" */
export function buildVariantLabel(colorName?: string, storageLabel?: string) {
  const label = [colorName, storageLabel].filter(Boolean).join(" · ");

  return label || "Color único";
}

/** Validación para el panel admin. Devuelve el mensaje de error o null. */
export function validateProductOptions(
  colors: ColorOption[],
  storages: StorageOption[]
): string | null {
  const names = new Set<string>();

  for (const color of colors) {
    const name = color.name.trim();

    if (!name) {
      return "Hay un color sin nombre. Escribe el nombre o elimínalo.";
    }

    const key = normalize(name);

    if (names.has(key)) {
      return `El color "${name}" está repetido.`;
    }

    names.add(key);
  }

  const labels = new Set<string>();

  for (const storage of storages) {
    const label = storage.label.trim();

    if (!label) {
      return "Hay una capacidad sin nombre. Escribe, por ejemplo, 256GB.";
    }

    const key = normalize(label);

    if (labels.has(key)) {
      return `La capacidad "${label}" está repetida.`;
    }

    labels.add(key);

    if (!Number.isFinite(storage.price) || storage.price <= 0) {
      return `Ingresa un precio válido para la capacidad ${label}.`;
    }

    if (storage.salePrice !== null && storage.salePrice !== undefined) {
      if (storage.salePrice <= 0 || storage.salePrice >= storage.price) {
        return `La oferta de ${label} debe ser menor a su precio normal.`;
      }
    }
  }

  return null;
}
