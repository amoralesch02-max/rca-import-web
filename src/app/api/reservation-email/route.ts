import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const ADMIN_EMAIL = "rca.importperu@gmail.com";

type ReservationEmailItem = {
  name?: string;
  variant?: string;
  color?: string;
  quantity?: number;
  price?: number;
};

type ReservationEmailPayload = {
  reservationCode?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerDni?: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  city?: string;
  paymentMethod?: string;
  amountPaid?: number | string;
  pendingAmount?: number | string;
  total?: number | string;
  paymentProofUrl?: string;
  createdAt?: string;
  items?: ReservationEmailItem[];
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value: unknown) {
  const numberValue = Number(value || 0);

  if (Number.isNaN(numberValue)) {
    return "S/ 0.00";
  }

  return `S/ ${numberValue.toFixed(2)}`;
}

function formatDate(value?: string) {
  if (!value) {
    return new Date().toLocaleString("es-PE");
  }

  return new Date(value).toLocaleString("es-PE");
}

function buildProductsHtml(items: ReservationEmailItem[] = []) {
  if (items.length === 0) {
    return `
      <tr>
        <td colspan="4" style="padding: 14px; color: #64748b; font-weight: 600;">
          No se enviaron productos en el detalle.
        </td>
      </tr>
    `;
  }

  return items
    .map((item) => {
      const color = item.color || item.variant || "Color único";
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const subtotal = quantity * price;

      return `
        <tr>
          <td style="padding: 14px; border-top: 1px solid #e2e8f0; font-weight: 800; color: #0f172a;">
            ${escapeHtml(item.name || "Producto")}
          </td>
          <td style="padding: 14px; border-top: 1px solid #e2e8f0; color: #475569; font-weight: 700;">
            ${escapeHtml(color)}
          </td>
          <td style="padding: 14px; border-top: 1px solid #e2e8f0; color: #475569; font-weight: 700; text-align: center;">
            ${quantity}
          </td>
          <td style="padding: 14px; border-top: 1px solid #e2e8f0; color: #0f172a; font-weight: 900; text-align: right;">
            ${formatMoney(subtotal)}
          </td>
        </tr>
      `;
    })
    .join("");
}

function buildEmailHtml(payload: ReservationEmailPayload) {
  const proofButton = payload.paymentProofUrl
    ? `
      <a href="${escapeHtml(payload.paymentProofUrl)}"
        target="_blank"
        style="display: inline-block; margin-top: 18px; background: #0057A8; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 14px; font-weight: 900;">
        Ver comprobante
      </a>
    `
    : `
      <p style="margin: 14px 0 0; color: #E31B23; font-weight: 800;">
        No se adjuntó comprobante o no se envió URL.
      </p>
    `;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Nueva reserva RCA IMPORT</title>
      </head>

      <body style="margin: 0; padding: 0; background: #f6f8fc; font-family: Arial, Helvetica, sans-serif;">
        <div style="max-width: 760px; margin: 0 auto; padding: 28px 16px;">
          <div style="background: #0f172a; color: #ffffff; border-radius: 28px 28px 0 0; padding: 30px;">
            <p style="margin: 0; color: #93c5fd; font-size: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">
              RCA IMPORT
            </p>

            <h1 style="margin: 12px 0 0; font-size: 32px; line-height: 1.15;">
              Nueva reserva recibida
            </h1>

            <p style="margin: 12px 0 0; color: #cbd5e1; font-size: 15px; line-height: 1.7;">
              Un cliente acaba de registrar una reserva desde la web.
            </p>
          </div>

          <div style="background: #ffffff; border-radius: 0 0 28px 28px; padding: 30px; border: 1px solid #e2e8f0; border-top: 0;">
            <div style="display: inline-block; background: #fee2e2; color: #E31B23; padding: 10px 14px; border-radius: 999px; font-size: 13px; font-weight: 900;">
              Código: ${escapeHtml(payload.reservationCode || "Sin código")}
            </div>

            <h2 style="margin: 26px 0 14px; color: #0f172a; font-size: 22px;">
              Datos del cliente
            </h2>

            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #f8fafc; border-radius: 18px; overflow: hidden;">
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800;">Cliente</td>
                <td style="padding: 14px; color: #0f172a; font-weight: 900;">${escapeHtml(payload.customerName || "No indicado")}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800; border-top: 1px solid #e2e8f0;">Teléfono</td>
                <td style="padding: 14px; color: #0f172a; font-weight: 900; border-top: 1px solid #e2e8f0;">${escapeHtml(payload.customerPhone || "No indicado")}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800; border-top: 1px solid #e2e8f0;">Correo</td>
                <td style="padding: 14px; color: #0f172a; font-weight: 900; border-top: 1px solid #e2e8f0;">${escapeHtml(payload.customerEmail || "No indicado")}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800; border-top: 1px solid #e2e8f0;">DNI</td>
                <td style="padding: 14px; color: #0f172a; font-weight: 900; border-top: 1px solid #e2e8f0;">${escapeHtml(payload.customerDni || "No indicado")}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800; border-top: 1px solid #e2e8f0;">Ciudad</td>
                <td style="padding: 14px; color: #0f172a; font-weight: 900; border-top: 1px solid #e2e8f0;">${escapeHtml(payload.city || "No indicado")}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800; border-top: 1px solid #e2e8f0;">Entrega</td>
                <td style="padding: 14px; color: #0f172a; font-weight: 900; border-top: 1px solid #e2e8f0;">${escapeHtml(payload.deliveryMethod || "No indicado")}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800; border-top: 1px solid #e2e8f0;">Dirección</td>
                <td style="padding: 14px; color: #0f172a; font-weight: 900; border-top: 1px solid #e2e8f0;">${escapeHtml(payload.deliveryAddress || "No indicada")}</td>
              </tr>
            </table>

            <h2 style="margin: 28px 0 14px; color: #0f172a; font-size: 22px;">
              Productos reservados
            </h2>

            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
              <thead>
                <tr style="background: #f1f5f9;">
                  <th align="left" style="padding: 14px; color: #334155; font-size: 13px;">Producto</th>
                  <th align="left" style="padding: 14px; color: #334155; font-size: 13px;">Color</th>
                  <th align="center" style="padding: 14px; color: #334155; font-size: 13px;">Cant.</th>
                  <th align="right" style="padding: 14px; color: #334155; font-size: 13px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${buildProductsHtml(payload.items)}
              </tbody>
            </table>

            <h2 style="margin: 28px 0 14px; color: #0f172a; font-size: 22px;">
              Pago
            </h2>

            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #f8fafc; border-radius: 18px; overflow: hidden;">
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800;">Método</td>
                <td style="padding: 14px; color: #0f172a; font-weight: 900;">${escapeHtml(payload.paymentMethod || "No indicado")}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800; border-top: 1px solid #e2e8f0;">Total</td>
                <td style="padding: 14px; color: #0f172a; font-weight: 900; border-top: 1px solid #e2e8f0;">${formatMoney(payload.total)}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800; border-top: 1px solid #e2e8f0;">Adelanto</td>
                <td style="padding: 14px; color: #0057A8; font-weight: 900; border-top: 1px solid #e2e8f0;">${formatMoney(payload.amountPaid)}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800; border-top: 1px solid #e2e8f0;">Saldo pendiente</td>
                <td style="padding: 14px; color: #E31B23; font-weight: 900; border-top: 1px solid #e2e8f0;">${formatMoney(payload.pendingAmount)}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #64748b; font-weight: 800; border-top: 1px solid #e2e8f0;">Fecha</td>
                <td style="padding: 14px; color: #0f172a; font-weight: 900; border-top: 1px solid #e2e8f0;">${escapeHtml(formatDate(payload.createdAt))}</td>
              </tr>
            </table>

            ${proofButton}

            <p style="margin: 28px 0 0; color: #64748b; font-size: 13px; line-height: 1.7;">
              Este correo fue generado automáticamente por la web de RCA IMPORT.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Falta RESEND_API_KEY.",
        },
        { status: 500 }
      );
    }

    const payload = (await request.json()) as ReservationEmailPayload;
    const resend = new Resend(apiKey);

    const reservationCode = payload.reservationCode || "Sin código";

    const { error } = await resend.emails.send({
      from: "RCA IMPORT <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `Nueva reserva RCA IMPORT - ${reservationCode}`,
      html: buildEmailHtml(payload),
    });

    if (error) {
      console.error("Error enviando correo de reserva:", error);

      return NextResponse.json(
        {
          success: false,
          error: "No se pudo enviar el correo.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error en reservation-email:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Error inesperado enviando el correo.",
      },
      { status: 500 }
    );
  }
}