import {
  DEFAULT_STORE_SETTINGS,
  type StoreSettings,
} from "@/lib/store-settings";
import { supabase } from "@/lib/supabase";

type SupabaseStoreSettings = {
  id: string;
  store_name: string | null;
  slogan: string | null;
  admin_email: string | null;
  whatsapp_main: string | null;
  whatsapp_secondary: string | null;
  yape_number: string | null;
  yape_owner: string | null;
  address: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  shipping_message: string | null;
  wholesale_message: string | null;
  payment_message: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminStoreSettings = StoreSettings & {
  id?: string;
};

function mapSupabaseSettings(
  settings: SupabaseStoreSettings | null
): AdminStoreSettings {
  if (!settings) {
    return {
      ...DEFAULT_STORE_SETTINGS,
    };
  }

  return {
    id: settings.id,
    storeName: settings.store_name ?? DEFAULT_STORE_SETTINGS.storeName,
    slogan: settings.slogan ?? DEFAULT_STORE_SETTINGS.slogan,
    adminEmail: settings.admin_email ?? DEFAULT_STORE_SETTINGS.adminEmail,
    whatsappMain:
      settings.whatsapp_main ?? DEFAULT_STORE_SETTINGS.whatsappMain,
    whatsappSecondary:
      settings.whatsapp_secondary ??
      DEFAULT_STORE_SETTINGS.whatsappSecondary,
    yapeNumber: settings.yape_number ?? DEFAULT_STORE_SETTINGS.yapeNumber,
    yapeOwner: settings.yape_owner ?? DEFAULT_STORE_SETTINGS.yapeOwner,
    address: settings.address ?? DEFAULT_STORE_SETTINGS.address,
    facebook: settings.facebook ?? DEFAULT_STORE_SETTINGS.facebook,
    instagram: settings.instagram ?? DEFAULT_STORE_SETTINGS.instagram,
    tiktok: settings.tiktok ?? DEFAULT_STORE_SETTINGS.tiktok,
    shippingMessage:
      settings.shipping_message ?? DEFAULT_STORE_SETTINGS.shippingMessage,
    wholesaleMessage:
      settings.wholesale_message ?? DEFAULT_STORE_SETTINGS.wholesaleMessage,
    paymentMessage:
      settings.payment_message ?? DEFAULT_STORE_SETTINGS.paymentMessage,
  };
}

function toSupabasePayload(settings: StoreSettings) {
  return {
    store_name: settings.storeName,
    slogan: settings.slogan,
    admin_email: settings.adminEmail,
    whatsapp_main: settings.whatsappMain,
    whatsapp_secondary: settings.whatsappSecondary,
    yape_number: settings.yapeNumber,
    yape_owner: settings.yapeOwner,
    address: settings.address,
    facebook: settings.facebook,
    instagram: settings.instagram,
    tiktok: settings.tiktok,
    shipping_message: settings.shippingMessage,
    wholesale_message: settings.wholesaleMessage,
    payment_message: settings.paymentMessage,
    updated_at: new Date().toISOString(),
  };
}

export async function getSupabaseStoreSettings(): Promise<AdminStoreSettings> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Error cargando configuración:", error.message);

    return {
      ...DEFAULT_STORE_SETTINGS,
    };
  }

  return mapSupabaseSettings(data as SupabaseStoreSettings | null);
}

export async function updateSupabaseStoreSettings(settings: StoreSettings) {
  const currentSettings = await getSupabaseStoreSettings();
  const settingsId = currentSettings.id;
  const payload = toSupabasePayload(settings);

  if (settingsId) {
    const { error } = await supabase
      .from("store_settings")
      .update(payload)
      .eq("id", settingsId);

    if (error) {
      console.error("Error actualizando configuración:", error.message);

      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      error: null,
    };
  }

  const { error } = await supabase.from("store_settings").insert(payload);

  if (error) {
    console.error("Error creando configuración:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    error: null,
  };
}