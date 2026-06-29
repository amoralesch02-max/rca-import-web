import { supabase } from "@/lib/supabase";

export type PublicBanner = {
  id: string;
  title: string;
  subtitle: string;
  label: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
  isActive: boolean;
  position: number;
  createdAt?: string;
};

type SupabaseBanner = {
  id: string;
  title: string | null;
  subtitle: string | null;
  label: string | null;
  button_text: string | null;
  button_url: string | null;
  image_url: string | null;
  is_active: boolean | null;
  position: number | null;
  created_at?: string;
};

function mapSupabaseBanner(banner: SupabaseBanner): PublicBanner {
  return {
    id: banner.id,
    title: banner.title ?? "",
    subtitle: banner.subtitle ?? "",
    label: banner.label ?? "",
    buttonText: banner.button_text ?? "Ver catálogo",
    buttonUrl: banner.button_url ?? "/catalogo",
    imageUrl: banner.image_url ?? "",
    isActive: banner.is_active ?? false,
    position: banner.position ?? 1,
    createdAt: banner.created_at,
  };
}

export async function getSupabaseBanners() {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando banners públicos:", error.message);
    return [];
  }

  console.log("Banners activos cargados en Home:", data);

  return (data as SupabaseBanner[]).map(mapSupabaseBanner);
}

export async function getSupabaseAdminBanners() {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando banners admin:", error.message);
    return [];
  }

  return (data as SupabaseBanner[]).map(mapSupabaseBanner);
}

export async function createSupabaseBanner(input: {
  title: string;
  subtitle: string;
  label: string;
  buttonText: string;
  buttonUrl: string;
  imageUrl: string;
  isActive: boolean;
  position: number;
}) {
  const { error } = await supabase.from("banners").insert({
    title: input.title,
    subtitle: input.subtitle,
    label: input.label,
    button_text: input.buttonText,
    button_url: input.buttonUrl,
    image_url: input.imageUrl,
    is_active: input.isActive,
    position: input.position,
  });

  if (error) {
    console.error("Error creando banner:", error.message);

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

export async function updateSupabaseBanner(
  id: string,
  input: {
    title?: string;
    subtitle?: string;
    label?: string;
    buttonText?: string;
    buttonUrl?: string;
    imageUrl?: string;
    isActive?: boolean;
    position?: number;
  }
) {
  const payload: Record<string, string | boolean | number> = {};

  if (typeof input.title === "string") {
    payload.title = input.title;
  }

  if (typeof input.subtitle === "string") {
    payload.subtitle = input.subtitle;
  }

  if (typeof input.label === "string") {
    payload.label = input.label;
  }

  if (typeof input.buttonText === "string") {
    payload.button_text = input.buttonText;
  }

  if (typeof input.buttonUrl === "string") {
    payload.button_url = input.buttonUrl;
  }

  if (typeof input.imageUrl === "string") {
    payload.image_url = input.imageUrl;
  }

  if (typeof input.isActive === "boolean") {
    payload.is_active = input.isActive;
  }

  if (typeof input.position === "number") {
    payload.position = input.position;
  }

  const { error } = await supabase.from("banners").update(payload).eq("id", id);

  if (error) {
    console.error("Error editando banner:", error.message);

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

export async function deleteSupabaseBanner(id: string) {
  const { error } = await supabase.from("banners").delete().eq("id", id);

  if (error) {
    console.error("Error eliminando banner:", error.message);

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