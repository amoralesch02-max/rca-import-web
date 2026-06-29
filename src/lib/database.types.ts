export type ProductStatus = "active" | "hidden" | "sold_out";

export type PaymentStatus =
  | "pending"
  | "confirmed"
  | "rejected"
  | "reserved"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type ProductCondition = "Nuevo" | "Open Box" | "Seminuevo";

export type ImportCountry = "USA" | "China" | "Perú";