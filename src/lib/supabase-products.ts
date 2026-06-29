import { supabase } from "@/lib/supabase";
import { type Product } from "@/data/products";

type SupabaseProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number;
  sale_price: number | null;
  stock: number;
  reserved_stock: number;
  country: string;
  country_flag: string;
  condition: string;
  tag: string;
  description: string;
  features: string[];
  variants: string[];
  image_url: string;
  gallery: string[];
  video_url: string;
  wholesale: boolean;
  allows_reservation: boolean;
  invoice: boolean;
  visible: boolean;
  available: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicProduct = Omit<Product, "country" | "condition"> & {
  dbId?: string;
  country: string;
  condition: string;
  visible?: boolean;
  available?: boolean;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UpdateProductInput = {
  visible?: boolean;
  available?: boolean;
  featured?: boolean;
  stock?: number;
  reservedStock?: number;
  tag?: string;
};

export type CreateProductInput = {
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  reservedStock: number;
  country: string;
  countryFlag: string;
  condition: string;
  tag: string;
  description: string;
  features: string[];
  variants: string[];
  imageUrl: string;
  gallery: string[];
  videoUrl: string;
  wholesale: boolean;
  allowsReservation: boolean;
  invoice: boolean;
  visible: boolean;
  available: boolean;
  featured: boolean;
};

export type UpdateFullProductInput = {
  name: string;
  slug: string;
  category: string;
  brand: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  reservedStock: number;
  country: string;
  countryFlag: string;
  condition: string;
  tag: string;
  description: string;
  features: string[];
  variants: string[];
  imageUrl: string;
  gallery: string[];
  videoUrl: string;
  wholesale: boolean;
  allowsReservation: boolean;
  invoice: boolean;
  visible: boolean;
  available: boolean;
  featured: boolean;
};

function mapSupabaseProduct(product: SupabaseProduct): PublicProduct {
  return {
    dbId: product.id,
    id: Number(product.id.replace(/\D/g, "").slice(0, 8)) || Date.now(),
    name: product.name,
    slug: product.slug,
    category: product.category,
    brand: product.brand,
    price: Number(product.price),
    salePrice: product.sale_price ? Number(product.sale_price) : undefined,
    stock: Number(product.stock),
    reservedStock: Number(product.reserved_stock),
    country: product.country,
    countryFlag: product.country_flag,
    condition: product.condition,
    tag: product.tag,
    description: product.description,
    features: product.features ?? [],
    variants: product.variants ?? [],
    imageUrl: product.image_url ?? "",
    gallery: product.gallery ?? [],
    videoUrl: product.video_url ?? "",
    wholesale: product.wholesale,
    allowsReservation: product.allows_reservation,
    invoice: product.invoice,
    visible: product.visible,
    available: product.available,
    featured: product.featured,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

export async function getSupabaseProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("visible", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando productos desde Supabase:", error.message);
    return [];
  }

  return (data as SupabaseProduct[]).map(mapSupabaseProduct);
}

export async function getSupabaseAdminProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando productos admin:", error.message);
    return [];
  }

  return (data as SupabaseProduct[]).map(mapSupabaseProduct);
}

export async function getSupabaseProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("visible", true)
    .single();

  if (error || !data) {
    console.error("Error cargando producto:", error?.message);
    return null;
  }

  return mapSupabaseProduct(data as SupabaseProduct);
}

export async function getSupabaseAdminProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) {
    console.error("Error cargando producto admin:", error?.message);
    return null;
  }

  return mapSupabaseProduct(data as SupabaseProduct);
}

export async function updateSupabaseProductBySlug(
  slug: string,
  updates: UpdateProductInput
) {
  const payload: Record<string, string | number | boolean | null> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.visible === "boolean") {
    payload.visible = updates.visible;
  }

  if (typeof updates.available === "boolean") {
    payload.available = updates.available;
  }

  if (typeof updates.featured === "boolean") {
    payload.featured = updates.featured;
  }

  if (typeof updates.stock === "number") {
    payload.stock = updates.stock;
  }

  if (typeof updates.reservedStock === "number") {
    payload.reserved_stock = updates.reservedStock;
  }

  if (typeof updates.tag === "string") {
    payload.tag = updates.tag;
  }

  const { error } = await supabase
    .from("products")
    .update(payload)
    .eq("slug", slug);

  if (error) {
    console.error("Error actualizando producto:", error.message);

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

export async function deleteSupabaseProductBySlug(slug: string) {
  const { error } = await supabase.from("products").delete().eq("slug", slug);

  if (error) {
    console.error("Error eliminando producto:", error.message);

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

export async function createSupabaseProduct(input: CreateProductInput) {
  const { error } = await supabase.from("products").insert({
    name: input.name,
    slug: input.slug,
    category: input.category,
    brand: input.brand,
    price: input.price,
    sale_price: input.salePrice ?? null,
    stock: input.stock,
    reserved_stock: input.reservedStock,
    country: input.country,
    country_flag: input.countryFlag,
    condition: input.condition,
    tag: input.tag,
    description: input.description,
    features: input.features,
    variants: input.variants,
    image_url: input.imageUrl,
    gallery: input.gallery,
    video_url: input.videoUrl,
    wholesale: input.wholesale,
    allows_reservation: input.allowsReservation,
    invoice: input.invoice,
    visible: input.visible,
    available: input.available,
    featured: input.featured,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error creando producto:", error.message);

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

export async function updateSupabaseFullProductBySlug(
  currentSlug: string,
  input: UpdateFullProductInput
) {
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      slug: input.slug,
      category: input.category,
      brand: input.brand,
      price: input.price,
      sale_price: input.salePrice ?? null,
      stock: input.stock,
      reserved_stock: input.reservedStock,
      country: input.country,
      country_flag: input.countryFlag,
      condition: input.condition,
      tag: input.tag,
      description: input.description,
      features: input.features,
      variants: input.variants,
      image_url: input.imageUrl,
      gallery: input.gallery,
      video_url: input.videoUrl,
      wholesale: input.wholesale,
      allows_reservation: input.allowsReservation,
      invoice: input.invoice,
      visible: input.visible,
      available: input.available,
      featured: input.featured,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", currentSlug);

  if (error) {
    console.error("Error editando producto:", error.message);

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