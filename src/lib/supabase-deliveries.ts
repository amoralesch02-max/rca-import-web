import { supabase } from "@/lib/supabase";

type SupabaseDelivery = {
  id: string;
  title: string;
  customer_name: string;
  product_name: string;
  city: string;
  description: string;
  image_url: string;
  delivered_at: string;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PublicDelivery = {
  id: string;
  title: string;
  customerName: string;
  productName: string;
  city: string;
  description: string;
  imageUrl: string;
  deliveredAt: string;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateDeliveryInput = {
  title: string;
  customerName: string;
  productName: string;
  city: string;
  description: string;
  imageUrl: string;
  deliveredAt: string;
  position: number;
  isActive: boolean;
};

export type UpdateDeliveryInput = {
  title?: string;
  customerName?: string;
  productName?: string;
  city?: string;
  description?: string;
  imageUrl?: string;
  deliveredAt?: string;
  position?: number;
  isActive?: boolean;
};

function mapSupabaseDelivery(delivery: SupabaseDelivery): PublicDelivery {
  return {
    id: delivery.id,
    title: delivery.title,
    customerName: delivery.customer_name,
    productName: delivery.product_name,
    city: delivery.city,
    description: delivery.description,
    imageUrl: delivery.image_url,
    deliveredAt: delivery.delivered_at,
    position: delivery.position,
    isActive: delivery.is_active,
    createdAt: delivery.created_at,
    updatedAt: delivery.updated_at,
  };
}

export async function getSupabaseDeliveries() {
  const { data, error } = await supabase
    .from("customer_deliveries")
    .select("*")
    .eq("is_active", true)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando entregas públicas:", error.message);
    return [];
  }

  return (data as SupabaseDelivery[]).map(mapSupabaseDelivery);
}

export async function getSupabaseAdminDeliveries() {
  const { data, error } = await supabase
    .from("customer_deliveries")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando entregas admin:", error.message);
    return [];
  }

  return (data as SupabaseDelivery[]).map(mapSupabaseDelivery);
}

export async function createSupabaseDelivery(input: CreateDeliveryInput) {
  const { error } = await supabase.from("customer_deliveries").insert({
    title: input.title,
    customer_name: input.customerName,
    product_name: input.productName,
    city: input.city,
    description: input.description,
    image_url: input.imageUrl,
    delivered_at: input.deliveredAt,
    position: input.position,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Error creando entrega:", error.message);

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

export async function updateSupabaseDelivery(
  id: string,
  input: UpdateDeliveryInput
) {
  const payload: Record<string, string | number | boolean | null> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof input.title === "string") {
    payload.title = input.title;
  }

  if (typeof input.customerName === "string") {
    payload.customer_name = input.customerName;
  }

  if (typeof input.productName === "string") {
    payload.product_name = input.productName;
  }

  if (typeof input.city === "string") {
    payload.city = input.city;
  }

  if (typeof input.description === "string") {
    payload.description = input.description;
  }

  if (typeof input.imageUrl === "string") {
    payload.image_url = input.imageUrl;
  }

  if (typeof input.deliveredAt === "string") {
    payload.delivered_at = input.deliveredAt;
  }

  if (typeof input.position === "number") {
    payload.position = input.position;
  }

  if (typeof input.isActive === "boolean") {
    payload.is_active = input.isActive;
  }

  const { error } = await supabase
    .from("customer_deliveries")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Error actualizando entrega:", error.message);

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

export async function deleteSupabaseDelivery(id: string) {
  const { error } = await supabase
    .from("customer_deliveries")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando entrega:", error.message);

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