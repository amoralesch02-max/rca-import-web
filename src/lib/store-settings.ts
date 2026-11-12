/** Tema visual de temporada de la tienda */
export type SeasonTheme = "normal" | "navidad" | "anio-nuevo";

export const SEASON_THEME_LABELS: Record<SeasonTheme, string> = {
  normal: "Normal",
  navidad: "Navidad",
  "anio-nuevo": "Año Nuevo",
};

export function parseSeasonTheme(value: unknown): SeasonTheme {
  return value === "navidad" || value === "anio-nuevo" ? value : "normal";
}

export type StoreSettings = {
  storeName: string;
  slogan: string;
  adminEmail: string;
  whatsappMain: string;
  whatsappSecondary: string;
  yapeNumber: string;
  yapeOwner: string;
  address: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  shippingMessage: string;
  wholesaleMessage: string;
  paymentMessage: string;
  /** Tema de temporada. Se cambia desde el panel admin (Configuración). */
  seasonTheme?: SeasonTheme;
};

export const SETTINGS_KEY = "rca_import_store_settings";

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "RCA IMPORT",
  slogan: "Crea · Innova · Importa",
  adminEmail: "rca.importperu@gmail.com",
  whatsappMain: "953447289",
  whatsappSecondary: "932173126",
  yapeNumber: "953 447 289",
  yapeOwner: "Robert Edinzon Ccallo Aguilar",
  address:
    "TACNA - CENTRO COMERCIAL TUPAC AMARUI-C#62 (Ref. frente al colegio Carlos Armando Laura)",
  facebook: "RCAImportss",
  instagram: "rcaimportss",
  tiktok: "rca_import_peru",
  shippingMessage:
    "Realizamos envíos a todo el Perú previa coordinación por WhatsApp.",
  wholesaleMessage:
    "Consulta precios especiales para compras al por mayor en accesorios, cables, cubos y productos importados.",
  paymentMessage:
    "Por ahora trabajamos con Yape manual y comprobante. Próximamente se activará pasarela de pago.",
  seasonTheme: "normal",
};

export function getStoreSettings(): StoreSettings {
  if (typeof window === "undefined") {
    return DEFAULT_STORE_SETTINGS;
  }

  const storedSettings = localStorage.getItem(SETTINGS_KEY);

  if (!storedSettings) {
    return DEFAULT_STORE_SETTINGS;
  }

  try {
    return {
      ...DEFAULT_STORE_SETTINGS,
      ...JSON.parse(storedSettings),
    };
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function getWhatsappUrl(phone: string, message: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/51${cleanPhone}?text=${encodedMessage}`;
}