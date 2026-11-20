import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  PLAZO_DIAS_HABILES,
  PROVEEDOR,
  TIPO_LABELS,
  getDeadline,
  toReclamoPayload,
  validateReclamo,
  type ReclamoInput,
} from "@/lib/libro-reclamaciones";

export const runtime = "nodejs";

const ADMIN_EMAIL = "rca.importperu@gmail.com";

/**
 * Remitente de los correos. Con "onboarding@resend.dev" Resend solo deja
 * enviar a tu propio correo; para que la copia le llegue al cliente hay que
 * verificar un dominio en Resend y poner aquí (o en la variable RESEND_FROM)
 * una dirección de ese dominio.
 */
const FROM = process.env.RESEND_FROM || "RCA IMPORT <onboarding@resend.dev>";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br />");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatDate(value: Date) {
  return value.toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "long",
  });
}

function row(label: string, value: unknown) {
  return `
    <tr>
      <td style="padding:8px 12px;width:38%;color:#64748b;font-size:13px;border-bottom:1px solid #e2e8f0;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:8px 12px;color:#0f172a;font-size:13px;font-weight:600;border-bottom:1px solid #e2e8f0;">${escapeHtml(value || "—")}</td>
    </tr>`;
}

function section(title: string, rows: string) {
  return `
    <h3 style="margin:22px 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#0057A8;">${escapeHtml(title)}</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;">${rows}</table>`;
}

function buildHojaHtml({
  input,
  codigo,
  fecha,
  direccion,
  intro,
}: {
  input: ReclamoInput;
  codigo: string;
  fecha: string;
  direccion: string;
  intro: string;
}) {
  const deadline = formatDate(getDeadline(fecha));

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#0f172a;">
    <h2 style="margin:0;font-size:20px;">Hoja de Reclamación N.° ${escapeHtml(codigo)}</h2>
    <p style="margin:6px 0 0;color:#64748b;font-size:13px;">Libro de Reclamaciones virtual · ${escapeHtml(formatDateTime(fecha))}</p>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.6;">${intro}</p>

    ${section(
      "Proveedor",
      row("Razón social", PROVEEDOR.razonSocial) +
        row("RUC", PROVEEDOR.ruc) +
        row("Nombre comercial", PROVEEDOR.nombreComercial) +
        row("Dirección", direccion)
    )}

    ${section(
      "1. Consumidor reclamante",
      row("Nombre", input.nombre) +
        row(input.tipoDocumento, input.numeroDocumento) +
        row("Domicilio", input.domicilio) +
        row("Teléfono", input.telefono) +
        row("Correo", input.email) +
        (input.esMenor
          ? row("Padre, madre o apoderado", input.apoderadoNombre) +
            row("Documento del apoderado", input.apoderadoDocumento)
          : "")
    )}

    ${section(
      "2. Bien contratado",
      row("Tipo", input.tipoBien === "servicio" ? "Servicio" : "Producto") +
        row("Monto reclamado", input.monto ? `S/ ${input.monto}` : "") +
        row("Descripción", input.descripcionBien) +
        row("N.° de pedido o comprobante", input.numeroPedido)
    )}

    ${section(
      "3. Detalle de la reclamación",
      row("Tipo", TIPO_LABELS[input.tipo]) +
        row("Detalle", input.detalle) +
        row("Pedido del consumidor", input.pedido)
    )}

    <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
      El proveedor debe responder en un plazo no mayor de ${PLAZO_DIAS_HABILES} días hábiles
      (fecha límite aproximada: ${escapeHtml(deadline)}).
      La formulación del reclamo no impide acudir a otras vías de solución de controversias
      ni es requisito previo para interponer una denuncia ante el INDECOPI.
    </p>
  </div>`;
}

export async function POST(request: Request) {
  let body: Partial<ReclamoInput> & { website?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo leer el formulario." },
      { status: 400 }
    );
  }

  // Campo trampa: las personas no lo ven; los robots lo llenan
  if (body.website) {
    return NextResponse.json({ ok: false, error: "Solicitud no válida." }, { status: 400 });
  }

  const input: ReclamoInput = {
    nombre: String(body.nombre ?? ""),
    tipoDocumento: String(body.tipoDocumento ?? "DNI"),
    numeroDocumento: String(body.numeroDocumento ?? ""),
    domicilio: String(body.domicilio ?? ""),
    telefono: String(body.telefono ?? ""),
    email: String(body.email ?? ""),
    esMenor: Boolean(body.esMenor),
    apoderadoNombre: String(body.apoderadoNombre ?? ""),
    apoderadoDocumento: String(body.apoderadoDocumento ?? ""),
    tipoBien: body.tipoBien === "servicio" ? "servicio" : "producto",
    monto: String(body.monto ?? ""),
    descripcionBien: String(body.descripcionBien ?? ""),
    numeroPedido: String(body.numeroPedido ?? ""),
    tipo: body.tipo === "queja" ? "queja" : "reclamo",
    detalle: String(body.detalle ?? ""),
    pedido: String(body.pedido ?? ""),
    acepta: Boolean(body.acepta),
  };

  const problem = validateReclamo(input);

  if (problem) {
    return NextResponse.json({ ok: false, error: problem }, { status: 400 });
  }

  // 1. Registrar la hoja (la base de datos asigna el número correlativo)
  const { data, error } = await supabase.rpc("registrar_reclamo", {
    datos: toReclamoPayload(input),
  });

  const saved = Array.isArray(data) ? data[0] : null;

  if (error || !saved) {
    console.error("Error registrando reclamo:", error?.message);

    return NextResponse.json(
      {
        ok: false,
        error:
          "No pudimos registrar tu hoja en este momento. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.",
      },
      { status: 500 }
    );
  }

  const codigo: string = saved.hoja_codigo;
  const fecha: string = saved.hoja_fecha;

  // 2. Correos (si fallan, la hoja igual queda registrada)
  let adminEmailSent = false;
  let customerEmailSent = false;
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey) {
    const resend = new Resend(apiKey);
    const settings = await getSupabaseStoreSettings();

    const adminResult = await resend.emails.send({
      from: FROM,
      to: [ADMIN_EMAIL],
      replyTo: input.email,
      subject: `Nuevo ${TIPO_LABELS[input.tipo].toLowerCase()} ${codigo} · Libro de Reclamaciones`,
      html: buildHojaHtml({
        input,
        codigo,
        fecha,
        direccion: settings.address,
        intro: `Se registró una nueva hoja en el Libro de Reclamaciones. Tienes <strong>${PLAZO_DIAS_HABILES} días hábiles</strong> para responder al correo del cliente.`,
      }),
    });

    adminEmailSent = !adminResult.error;

    if (adminResult.error) {
      console.error("Error enviando reclamo al admin:", adminResult.error.message);
    }

    const customerResult = await resend.emails.send({
      from: FROM,
      to: [input.email],
      replyTo: ADMIN_EMAIL,
      subject: `Copia de tu Hoja de Reclamación ${codigo} · ${PROVEEDOR.nombreComercial}`,
      html: buildHojaHtml({
        input,
        codigo,
        fecha,
        direccion: settings.address,
        intro: `Hola ${escapeHtml(input.nombre)}, registramos tu ${TIPO_LABELS[input.tipo].toLowerCase()}. Esta es la copia de tu hoja. Te responderemos a este correo.`,
      }),
    });

    customerEmailSent = !customerResult.error;

    if (customerResult.error) {
      console.error("Error enviando copia al cliente:", customerResult.error.message);
    }
  } else {
    console.error("Falta RESEND_API_KEY: el reclamo se guardó sin enviar correos.");
  }

  return NextResponse.json({
    ok: true,
    codigo,
    fecha,
    adminEmailSent,
    customerEmailSent,
  });
}
