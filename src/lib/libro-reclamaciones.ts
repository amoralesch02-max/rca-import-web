import { supabase } from "@/lib/supabase";

/**
 * Datos del proveedor que aparecen en cada Hoja de Reclamación.
 * La dirección se toma de la configuración de la tienda (panel admin).
 */
export const PROVEEDOR = {
  razonSocial: "",
  ruc: "",
  nombreComercial: "RCA IMPORT",
};

/** Plazo legal de respuesta: 15 días hábiles (D.S. 101-2022-PCM). */
export const PLAZO_DIAS_HABILES = 15;

export type TipoReclamo = "reclamo" | "queja";
export type TipoBien = "producto" | "servicio";
export type EstadoReclamo = "pendiente" | "respondido";

/** Lo que el cliente llena en el formulario público. */
export type ReclamoInput = {
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  domicilio: string;
  telefono: string;
  email: string;
  esMenor: boolean;
  apoderadoNombre: string;
  apoderadoDocumento: string;
  tipoBien: TipoBien;
  monto: string;
  descripcionBien: string;
  numeroPedido: string;
  tipo: TipoReclamo;
  detalle: string;
  pedido: string;
  acepta: boolean;
};

/** Una hoja ya registrada (vista del admin). */
export type Reclamo = ReclamoInput & {
  id: string;
  numero: number;
  codigo: string;
  createdAt: string;
  estado: EstadoReclamo;
  respuesta: string;
  fechaRespuesta: string;
};

type ReclamoRow = {
  id: string;
  numero: number;
  codigo: string;
  created_at: string;
  nombre: string;
  tipo_documento: string;
  numero_documento: string;
  domicilio: string;
  telefono: string;
  email: string;
  es_menor: boolean;
  apoderado_nombre: string | null;
  apoderado_documento: string | null;
  tipo_bien: TipoBien;
  monto: number | string | null;
  descripcion_bien: string;
  numero_pedido: string | null;
  tipo: TipoReclamo;
  detalle: string;
  pedido: string;
  acepta: boolean;
  estado: EstadoReclamo;
  respuesta: string | null;
  fecha_respuesta: string | null;
};

export const TIPO_LABELS: Record<TipoReclamo, string> = {
  reclamo: "Reclamo",
  queja: "Queja",
};

export const TIPO_DESCRIPCION: Record<TipoReclamo, string> = {
  reclamo: "Disconformidad con el producto o servicio adquirido.",
  queja:
    "Malestar o descontento con la atención recibida, no relacionado con el producto o servicio.",
};

/** Convierte los datos del formulario al formato que espera la base de datos. */
export function toReclamoPayload(input: ReclamoInput) {
  return {
    nombre: input.nombre.trim(),
    tipo_documento: input.tipoDocumento,
    numero_documento: input.numeroDocumento.trim(),
    domicilio: input.domicilio.trim(),
    telefono: input.telefono.trim(),
    email: input.email.trim(),
    es_menor: input.esMenor,
    apoderado_nombre: input.esMenor ? input.apoderadoNombre.trim() : "",
    apoderado_documento: input.esMenor ? input.apoderadoDocumento.trim() : "",
    tipo_bien: input.tipoBien,
    monto: input.monto.trim(),
    descripcion_bien: input.descripcionBien.trim(),
    numero_pedido: input.numeroPedido.trim(),
    tipo: input.tipo,
    detalle: input.detalle.trim(),
    pedido: input.pedido.trim(),
    acepta: input.acepta,
  };
}

/** Revisa el formulario. Devuelve el primer problema encontrado o "". */
export function validateReclamo(input: ReclamoInput) {
  if (!input.nombre.trim()) return "Ingresa tu nombre completo.";
  if (!input.numeroDocumento.trim()) return "Ingresa tu número de documento.";
  if (!input.domicilio.trim()) return "Ingresa tu domicilio.";
  if (!input.telefono.trim()) return "Ingresa tu teléfono.";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return "Ingresa un correo válido. Ahí te enviaremos la copia de tu hoja.";
  }

  if (
    input.esMenor &&
    (!input.apoderadoNombre.trim() || !input.apoderadoDocumento.trim())
  ) {
    return "Completa los datos del padre, madre o apoderado.";
  }

  if (input.monto.trim() && !/^\d+(\.\d{1,2})?$/.test(input.monto.trim())) {
    return "El monto debe ser un número, por ejemplo 150 o 150.50.";
  }

  if (!input.descripcionBien.trim()) {
    return "Describe el producto o servicio.";
  }

  if (!input.detalle.trim()) return "Cuéntanos el detalle de lo ocurrido.";
  if (!input.pedido.trim()) return "Indica qué solicitas.";

  if (!input.acepta) {
    return "Debes confirmar que los datos son verdaderos.";
  }

  return "";
}

/** Suma días hábiles (lunes a viernes). No descuenta feriados. */
export function addBusinessDays(start: Date, days: number) {
  const date = new Date(start);
  let added = 0;

  while (added < days) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();

    if (day !== 0 && day !== 6) {
      added += 1;
    }
  }

  return date;
}

/** Fecha límite para responder una hoja. */
export function getDeadline(createdAt: string) {
  return addBusinessDays(new Date(createdAt), PLAZO_DIAS_HABILES);
}

function mapRow(row: ReclamoRow): Reclamo {
  return {
    id: row.id,
    numero: row.numero,
    codigo: row.codigo,
    createdAt: row.created_at,
    nombre: row.nombre,
    tipoDocumento: row.tipo_documento,
    numeroDocumento: row.numero_documento,
    domicilio: row.domicilio,
    telefono: row.telefono,
    email: row.email,
    esMenor: row.es_menor,
    apoderadoNombre: row.apoderado_nombre ?? "",
    apoderadoDocumento: row.apoderado_documento ?? "",
    tipoBien: row.tipo_bien,
    monto: row.monto === null ? "" : String(row.monto),
    descripcionBien: row.descripcion_bien,
    numeroPedido: row.numero_pedido ?? "",
    tipo: row.tipo,
    detalle: row.detalle,
    pedido: row.pedido,
    acepta: row.acepta,
    estado: row.estado,
    respuesta: row.respuesta ?? "",
    fechaRespuesta: row.fecha_respuesta ?? "",
  };
}

/** Admin: todas las hojas, de la más reciente a la más antigua. */
export async function getAdminReclamos() {
  const { data, error } = await supabase
    .from("libro_reclamaciones")
    .select("*")
    .order("numero", { ascending: false });

  if (error) {
    console.error("Error cargando el libro de reclamaciones:", error.message);
    return { reclamos: [] as Reclamo[], error: error.message };
  }

  return { reclamos: (data as ReclamoRow[]).map(mapRow), error: "" };
}

/** Admin: guarda la respuesta del proveedor. */
export async function saveReclamoRespuesta(
  id: string,
  respuesta: string,
  fechaRespuesta: string,
  estado: EstadoReclamo
) {
  const { error } = await supabase
    .from("libro_reclamaciones")
    .update({
      respuesta: respuesta.trim() || null,
      fecha_respuesta: fechaRespuesta || null,
      estado,
    })
    .eq("id", id);

  return { error: error?.message ?? "" };
}
