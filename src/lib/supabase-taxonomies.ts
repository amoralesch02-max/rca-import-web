import { supabase } from "@/lib/supabase";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
};

export type PublicBrand = {
  id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
};

export type PublicCountry = {
  id: string;
  name: string;
  slug: string;
  flag: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
};

type SupabaseCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at?: string;
};

type SupabaseBrand = {
  id: string;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at?: string;
};

type SupabaseCountry = {
  id: string;
  name: string;
  slug: string;
  flag: string;
  description: string;
  is_active: boolean;
  created_at?: string;
};

function mapCategory(category: SupabaseCategory): PublicCategory {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    isActive: category.is_active,
    createdAt: category.created_at,
  };
}

function mapBrand(brand: SupabaseBrand): PublicBrand {
  return {
    id: brand.id,
    name: brand.name,
    slug: brand.slug,
    description: brand.description,
    isActive: brand.is_active,
    createdAt: brand.created_at,
  };
}

function mapCountry(country: SupabaseCountry): PublicCountry {
  return {
    id: country.id,
    name: country.name,
    slug: country.slug,
    flag: country.flag,
    description: country.description,
    isActive: country.is_active,
    createdAt: country.created_at,
  };
}

export async function getSupabaseCategoryBySlug(slug: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return mapCategory(data as SupabaseCategory);
}

export async function getSupabaseBrandBySlug(slug: string) {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return mapBrand(data as SupabaseBrand);
}

export async function getSupabaseCountryBySlug(slug: string) {
  const { data, error } = await supabase
    .from("import_countries")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return mapCountry(data as SupabaseCountry);
}

export async function getSupabaseAdminCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando categorías:", error.message);
    return [];
  }

  return (data as SupabaseCategory[]).map(mapCategory);
}

export async function createSupabaseCategory(input: {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}) {
  const { error } = await supabase.from("categories").insert({
    name: input.name,
    slug: input.slug,
    description: input.description,
    is_active: input.isActive,
  });

  if (error) {
    console.error("Error creando categoría:", error.message);

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

export async function updateSupabaseCategory(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  const payload: Record<string, string | boolean> = {};

  if (typeof input.name === "string") {
    payload.name = input.name;
  }

  if (typeof input.slug === "string") {
    payload.slug = input.slug;
  }

  if (typeof input.description === "string") {
    payload.description = input.description;
  }

  if (typeof input.isActive === "boolean") {
    payload.is_active = input.isActive;
  }

  const { error } = await supabase
    .from("categories")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Error editando categoría:", error.message);

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

export async function deleteSupabaseCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    console.error("Error eliminando categoría:", error.message);

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
export async function getSupabaseAdminBrands() {
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando marcas:", error.message);
    return [];
  }

  return (data as SupabaseBrand[]).map(mapBrand);
}

export async function createSupabaseBrand(input: {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
}) {
  const { error } = await supabase.from("brands").insert({
    name: input.name,
    slug: input.slug,
    description: input.description,
    is_active: input.isActive,
  });

  if (error) {
    console.error("Error creando marca:", error.message);

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

export async function updateSupabaseBrand(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  const payload: Record<string, string | boolean> = {};

  if (typeof input.name === "string") {
    payload.name = input.name;
  }

  if (typeof input.slug === "string") {
    payload.slug = input.slug;
  }

  if (typeof input.description === "string") {
    payload.description = input.description;
  }

  if (typeof input.isActive === "boolean") {
    payload.is_active = input.isActive;
  }

  const { error } = await supabase.from("brands").update(payload).eq("id", id);

  if (error) {
    console.error("Error editando marca:", error.message);

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

export async function deleteSupabaseBrand(id: string) {
  const { error } = await supabase.from("brands").delete().eq("id", id);

  if (error) {
    console.error("Error eliminando marca:", error.message);

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
export async function getSupabaseAdminCountries() {
  const { data, error } = await supabase
    .from("import_countries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando países:", error.message);
    return [];
  }

  return (data as SupabaseCountry[]).map(mapCountry);
}

export async function createSupabaseCountry(input: {
  name: string;
  slug: string;
  flag: string;
  description: string;
  isActive: boolean;
}) {
  const { error } = await supabase.from("import_countries").insert({
    name: input.name,
    slug: input.slug,
    flag: input.flag,
    description: input.description,
    is_active: input.isActive,
  });

  if (error) {
    console.error("Error creando país:", error.message);

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

export async function updateSupabaseCountry(
  id: string,
  input: {
    name?: string;
    slug?: string;
    flag?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  const payload: Record<string, string | boolean> = {};

  if (typeof input.name === "string") {
    payload.name = input.name;
  }

  if (typeof input.slug === "string") {
    payload.slug = input.slug;
  }

  if (typeof input.flag === "string") {
    payload.flag = input.flag;
  }

  if (typeof input.description === "string") {
    payload.description = input.description;
  }

  if (typeof input.isActive === "boolean") {
    payload.is_active = input.isActive;
  }

  const { error } = await supabase
    .from("import_countries")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Error editando país:", error.message);

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

export async function deleteSupabaseCountry(id: string) {
  const { error } = await supabase
    .from("import_countries")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando país:", error.message);

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
export async function getSupabaseCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error cargando categorías públicas:", error.message);
    return [];
  }

  return (data as SupabaseCategory[]).map(mapCategory);
}