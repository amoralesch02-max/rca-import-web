import { supabase } from "@/lib/supabase";

export type ReservationCartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  variant: string;
  quantity: number;
};

export type CreateReservationInput = {
  id: string;
  customerName: string;
  documentNumber: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  operationType: string;
  paymentMethod: string;
  amountPaid: number;
  paymentProofName: string;
  paymentProofPath?: string;
  paymentProofUrl?: string;
  total: number;
  status: string;
  cart: ReservationCartItem[];
};

export type PublicReservationItem = {
  id: string;
  reservationId: string;
  productSlug: string;
  productName: string;
  variant: string;
  quantity: number;
  price: number;
};

export type PublicReservation = {
  id: string;
  createdAt: string;
  customerName: string;
  documentNumber: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  operationType: string;
  paymentMethod: string;
  amountPaid: number;
  paymentProofName: string;
  paymentProofPath: string;
  paymentProofUrl: string;
  total: number;
  status: string;
  items: PublicReservationItem[];
};

type SupabaseReservation = {
  id: string;
  created_at: string;
  customer_name: string;
  document_number: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  operation_type: string;
  payment_method: string;
  amount_paid: number;
  payment_proof_name: string | null;
  payment_proof_path: string | null;
  payment_proof_url: string | null;
  total: number;
  status: string;
};

type SupabaseReservationItem = {
  id: string;
  reservation_id: string;
  product_slug: string;
  product_name: string;
  variant: string;
  quantity: number;
  price: number;
};

type ReservationRpcResponse = {
  reservation: SupabaseReservation | null;
  items: SupabaseReservationItem[];
};

export async function createSupabaseReservation(input: CreateReservationInput) {
  const { error: reservationError } = await supabase
    .from("reservations")
    .insert({
      id: input.id,
      customer_name: input.customerName,
      document_number: input.documentNumber,
      phone: input.phone,
      department: input.department,
      city: input.city,
      address: input.address,
      operation_type: input.operationType,
      payment_method: input.paymentMethod,
      amount_paid: input.amountPaid,
      payment_proof_name: input.paymentProofName,
      payment_proof_path: input.paymentProofPath ?? "",
      payment_proof_url: input.paymentProofUrl ?? "",
      total: input.total,
      status: input.status,
    });

  if (reservationError) {
    console.error("Error creando reserva:", reservationError.message);

    return {
      success: false,
      error: reservationError.message,
    };
  }

  const reservationItems = input.cart.map((item) => ({
    reservation_id: input.id,
    product_slug: item.slug,
    product_name: item.name,
    variant: item.variant,
    quantity: item.quantity,
    price: item.price,
  }));

  const { error: itemsError } = await supabase
    .from("reservation_items")
    .insert(reservationItems);

  if (itemsError) {
    console.error("Error creando productos de reserva:", itemsError.message);

    return {
      success: false,
      error: itemsError.message,
    };
  }

  return {
    success: true,
    error: null,
  };
}

export async function getSupabaseReservationByCode(code: string) {
  const { data, error } = await supabase.rpc(
    "get_public_reservation_by_code",
    {
      p_code: code,
    }
  );

  if (error || !data) {
    console.error("Error buscando reserva:", error?.message);
    return null;
  }

  const response = data as ReservationRpcResponse;

  if (!response.reservation) {
    return null;
  }

  return mapReservation(response.reservation, response.items ?? []);
}

export async function getSupabaseAdminReservations() {
  const { data: reservationsData, error: reservationsError } = await supabase
    .from("reservations")
    .select("*")
    .order("created_at", { ascending: false });

  if (reservationsError) {
    console.error("Error cargando reservas:", reservationsError.message);
    return [];
  }

  const reservations = (reservationsData ?? []) as SupabaseReservation[];

  if (reservations.length === 0) {
    return [];
  }

  const reservationIds = reservations.map((reservation) => reservation.id);

  const { data: itemsData, error: itemsError } = await supabase
    .from("reservation_items")
    .select("*")
    .in("reservation_id", reservationIds)
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Error cargando productos de reservas:", itemsError.message);
    return reservations.map((reservation) => mapReservation(reservation, []));
  }

  const items = (itemsData ?? []) as SupabaseReservationItem[];

  return reservations.map((reservation) => {
    const reservationItems = items.filter(
      (item) => item.reservation_id === reservation.id
    );

    return mapReservation(reservation, reservationItems);
  });
}

export async function updateSupabaseReservationStatus(
  reservationId: string,
  status: string
) {
  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", reservationId);

  if (error) {
    console.error("Error actualizando estado:", error.message);

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

function mapReservation(
  reservation: SupabaseReservation,
  items: SupabaseReservationItem[]
): PublicReservation {
  return {
    id: reservation.id,
    createdAt: reservation.created_at,
    customerName: reservation.customer_name,
    documentNumber: reservation.document_number,
    phone: reservation.phone,
    department: reservation.department,
    city: reservation.city,
    address: reservation.address,
    operationType: reservation.operation_type,
    paymentMethod: reservation.payment_method,
    amountPaid: Number(reservation.amount_paid),
    paymentProofName: reservation.payment_proof_name ?? "",
    paymentProofPath: reservation.payment_proof_path ?? "",
    paymentProofUrl: reservation.payment_proof_url ?? "",
    total: Number(reservation.total),
    status: reservation.status,
    items: items.map((item) => ({
      id: item.id,
      reservationId: item.reservation_id,
      productSlug: item.product_slug,
      productName: item.product_name,
      variant: item.variant,
      quantity: item.quantity,
      price: Number(item.price),
    })),
  };
}