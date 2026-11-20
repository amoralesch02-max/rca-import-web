"use client";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  PLAZO_DIAS_HABILES,
  PROVEEDOR,
  TIPO_DESCRIPCION,
  TIPO_LABELS,
  getDeadline,
  validateReclamo,
  type ReclamoInput,
  type TipoBien,
  type TipoReclamo,
} from "@/lib/libro-reclamaciones";
import { DEFAULT_STORE_SETTINGS } from "@/lib/store-settings";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Loader2,
  Printer,
} from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";

const container = "mx-auto max-w-3xl px-5 md:px-6";

const inputClass =
  "mt-1.5 h-11 w-full rounded-xl border border-line bg-bg px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white";

const textareaClass =
  "mt-1.5 w-full resize-y rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white";

const EMPTY_FORM: ReclamoInput = {
  nombre: "",
  tipoDocumento: "DNI",
  numeroDocumento: "",
  domicilio: "",
  telefono: "",
  email: "",
  esMenor: false,
  apoderadoNombre: "",
  apoderadoDocumento: "",
  tipoBien: "producto",
  monto: "",
  descripcionBien: "",
  numeroPedido: "",
  tipo: "reclamo",
  detalle: "",
  pedido: "",
  acepta: false,
};

type Registered = {
  codigo: string;
  fecha: string;
  customerEmailSent: boolean;
  data: ReclamoInput;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatDate(value: Date) {
  return value.toLocaleDateString("es-PE", { dateStyle: "long" });
}

export default function LibroReclamacionesPage() {
  const [address, setAddress] = useState(DEFAULT_STORE_SETTINGS.address);
  const [form, setForm] = useState<ReclamoInput>(EMPTY_FORM);
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [registered, setRegistered] = useState<Registered | null>(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    getSupabaseStoreSettings().then((settings) => {
      if (settings.address) {
        setAddress(settings.address);
      }
    });

    setToday(
      new Date().toLocaleDateString("es-PE", { dateStyle: "long" })
    );
  }, []);

  function update<K extends keyof ReclamoInput>(key: K, value: ReclamoInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const problem = validateReclamo(form);

    if (problem) {
      setErrorMessage(problem);
      return;
    }

    setSending(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/libro-reclamaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setErrorMessage(
          result.error ||
            "No pudimos registrar tu hoja. Inténtalo de nuevo en unos minutos."
        );
        return;
      }

      setRegistered({
        codigo: result.codigo,
        fecha: result.fecha,
        customerEmailSent: Boolean(result.customerEmailSent),
        data: form,
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrorMessage(
        "No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg text-slate-950">
      {/* Al imprimir la constancia solo sale la hoja */}
      <style>{`@media print { header.sticky, footer { display: none !important; } }`}</style>

      <SiteHeader />

      <section className="border-b border-line bg-white print:border-0">
        <div className={`${container} py-10 md:py-12`}>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand print:hidden">
              <BookOpen size={22} />
            </span>

            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Libro de Reclamaciones
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Conforme a lo establecido en el Código de Protección y Defensa
                del Consumidor.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className={`${container} py-8 md:py-10`}>
        {registered ? (
          <Constancia
            registered={registered}
            address={address}
            onNew={() => {
              setRegistered(null);
              setForm(EMPTY_FORM);
            }}
          />
        ) : (
          <form onSubmit={handleSubmit} noValidate className="grid gap-6">
            {/* Proveedor */}
            <Card>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Hoja de Reclamación
              </p>

              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Info label="Razón social" value={PROVEEDOR.razonSocial} />
                <Info label="RUC" value={PROVEEDOR.ruc} />
                <Info label="Nombre comercial" value={PROVEEDOR.nombreComercial} />
                <Info label="Fecha" value={today} />
                <div className="sm:col-span-2">
                  <Info label="Dirección" value={address} />
                </div>
              </dl>

              <p className="mt-4 rounded-xl bg-bg px-4 py-3 text-xs leading-5 text-slate-500">
                El número de tu hoja se asigna al enviarla. Recibirás una
                constancia en pantalla y una copia en tu correo.
              </p>
            </Card>

            {/* 1. Consumidor */}
            <Card>
              <SectionTitle number="1" title="Identificación del consumidor reclamante" />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Nombres y apellidos" required className="sm:col-span-2">
                  <input
                    value={form.nombre}
                    onChange={(event) => update("nombre", event.target.value)}
                    autoComplete="name"
                    className={inputClass}
                  />
                </Field>

                <Field label="Tipo de documento" required>
                  <select
                    value={form.tipoDocumento}
                    onChange={(event) => update("tipoDocumento", event.target.value)}
                    className={inputClass}
                  >
                    <option>DNI</option>
                    <option>Carné de extranjería</option>
                    <option>Pasaporte</option>
                    <option>RUC</option>
                  </select>
                </Field>

                <Field label="Número de documento" required>
                  <input
                    value={form.numeroDocumento}
                    onChange={(event) => update("numeroDocumento", event.target.value)}
                    inputMode={form.tipoDocumento === "Pasaporte" ? "text" : "numeric"}
                    className={inputClass}
                  />
                </Field>

                <Field label="Domicilio" required className="sm:col-span-2">
                  <input
                    value={form.domicilio}
                    onChange={(event) => update("domicilio", event.target.value)}
                    autoComplete="street-address"
                    placeholder="Dirección, distrito, provincia"
                    className={inputClass}
                  />
                </Field>

                <Field label="Teléfono" required>
                  <input
                    value={form.telefono}
                    onChange={(event) => update("telefono", event.target.value)}
                    type="tel"
                    autoComplete="tel"
                    className={inputClass}
                  />
                </Field>

                <Field label="Correo electrónico" required>
                  <input
                    value={form.email}
                    onChange={(event) => update("email", event.target.value)}
                    type="email"
                    autoComplete="email"
                    className={inputClass}
                  />
                </Field>

                <label className="flex items-center gap-2.5 text-sm text-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.esMenor}
                    onChange={(event) => update("esMenor", event.target.checked)}
                    className="h-4 w-4 accent-brand"
                  />
                  Soy menor de edad
                </label>

                {form.esMenor && (
                  <>
                    <Field label="Nombre del padre, madre o apoderado" required>
                      <input
                        value={form.apoderadoNombre}
                        onChange={(event) => update("apoderadoNombre", event.target.value)}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Documento del apoderado" required>
                      <input
                        value={form.apoderadoDocumento}
                        onChange={(event) =>
                          update("apoderadoDocumento", event.target.value)
                        }
                        className={inputClass}
                      />
                    </Field>
                  </>
                )}
              </div>
            </Card>

            {/* 2. Bien contratado */}
            <Card>
              <SectionTitle number="2" title="Identificación del bien contratado" />

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Tipo" required group className="sm:col-span-2">
                  <div className="mt-1.5 grid grid-cols-2 gap-3">
                    {(["producto", "servicio"] as TipoBien[]).map((option) => (
                      <ChoiceButton
                        key={option}
                        selected={form.tipoBien === option}
                        onClick={() => update("tipoBien", option)}
                        title={option === "producto" ? "Producto" : "Servicio"}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Monto reclamado (S/)">
                  <input
                    value={form.monto}
                    onChange={(event) => update("monto", event.target.value)}
                    inputMode="decimal"
                    placeholder="Ej. 150.00"
                    className={inputClass}
                  />
                </Field>

                <Field label="N.° de pedido o comprobante">
                  <input
                    value={form.numeroPedido}
                    onChange={(event) => update("numeroPedido", event.target.value)}
                    placeholder="Opcional"
                    className={inputClass}
                  />
                </Field>

                <Field label="Descripción del producto o servicio" required className="sm:col-span-2">
                  <textarea
                    value={form.descripcionBien}
                    onChange={(event) => update("descripcionBien", event.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder="Ej. iPhone 15 Pro 256 GB, color titanio"
                    className={textareaClass}
                  />
                </Field>
              </div>
            </Card>

            {/* 3. Detalle */}
            <Card>
              <SectionTitle number="3" title="Detalle de la reclamación y pedido del consumidor" />

              <div className="mt-5 grid gap-4">
                <Field label="Tipo" required group>
                  <div className="mt-1.5 grid gap-3 sm:grid-cols-2">
                    {(["reclamo", "queja"] as TipoReclamo[]).map((option) => (
                      <ChoiceButton
                        key={option}
                        selected={form.tipo === option}
                        onClick={() => update("tipo", option)}
                        title={TIPO_LABELS[option]}
                        description={TIPO_DESCRIPCION[option]}
                      />
                    ))}
                  </div>
                </Field>

                <Field label="Detalle" required>
                  <textarea
                    value={form.detalle}
                    onChange={(event) => update("detalle", event.target.value)}
                    rows={5}
                    maxLength={4000}
                    placeholder="Cuéntanos qué ocurrió"
                    className={textareaClass}
                  />
                </Field>

                <Field label="Pedido" required>
                  <textarea
                    value={form.pedido}
                    onChange={(event) => update("pedido", event.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="¿Qué solución solicitas?"
                    className={textareaClass}
                  />
                </Field>
              </div>
            </Card>

            {/* Campo trampa para robots: las personas no lo ven */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-px w-px opacity-0"
            />

            <Card>
              <label className="flex gap-3 text-sm leading-6 text-slate-700">
                <input
                  type="checkbox"
                  checked={form.acepta}
                  onChange={(event) => update("acepta", event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-brand"
                />
                Declaro que los datos consignados son verdaderos y acepto el
                contenido de esta hoja de reclamación.
              </label>

              <LegalNotes />

              {errorMessage && (
                <div
                  role="alert"
                  className="mt-5 flex gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-alert"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60 sm:w-auto"
              >
                {sending && <Loader2 size={17} className="animate-spin" />}
                {sending ? "Enviando..." : "Enviar hoja de reclamación"}
              </button>
            </Card>
          </form>
        )}
      </div>

      <SiteFooter />
    </main>
  );
}

/* ---------------------------------------------------------------- */

function Constancia({
  registered,
  address,
  onNew,
}: {
  registered: Registered;
  address: string;
  onNew: () => void;
}) {
  const { data } = registered;

  return (
    <div className="grid gap-6">
      <div className="flex gap-3 rounded-2xl bg-green-50 p-5 text-green-800 print:hidden">
        <CheckCircle2 className="mt-0.5 shrink-0" size={22} />
        <div className="text-sm leading-6">
          <p className="font-semibold">
            Registramos tu hoja N.° {registered.codigo}.
          </p>
          <p>
            {registered.customerEmailSent
              ? `Te enviamos una copia a ${data.email}. `
              : "Guarda esta constancia: descárgala o imprímela con el botón de abajo. "}
            Te responderemos en un plazo máximo de {PLAZO_DIAS_HABILES} días
            hábiles.
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Hoja de Reclamación
            </p>
            <p className="mt-1 text-xl font-bold">N.° {registered.codigo}</p>
            <p className="text-sm text-slate-500">
              {formatDateTime(registered.fecha)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold transition hover:border-brand hover:text-brand print:hidden"
          >
            <Printer size={16} />
            Descargar o imprimir
          </button>
        </div>

        <SummaryBlock
          title="Proveedor"
          rows={[
            ["Razón social", PROVEEDOR.razonSocial],
            ["RUC", PROVEEDOR.ruc],
            ["Nombre comercial", PROVEEDOR.nombreComercial],
            ["Dirección", address],
          ]}
        />

        <SummaryBlock
          title="1. Consumidor reclamante"
          rows={[
            ["Nombre", data.nombre],
            [data.tipoDocumento, data.numeroDocumento],
            ["Domicilio", data.domicilio],
            ["Teléfono", data.telefono],
            ["Correo", data.email],
            ...(data.esMenor
              ? ([
                  ["Padre, madre o apoderado", data.apoderadoNombre],
                  ["Documento del apoderado", data.apoderadoDocumento],
                ] as [string, string][])
              : []),
          ]}
        />

        <SummaryBlock
          title="2. Bien contratado"
          rows={[
            ["Tipo", data.tipoBien === "servicio" ? "Servicio" : "Producto"],
            ["Monto reclamado", data.monto ? `S/ ${data.monto}` : ""],
            ["Descripción", data.descripcionBien],
            ["N.° de pedido o comprobante", data.numeroPedido],
          ]}
        />

        <SummaryBlock
          title="3. Detalle de la reclamación"
          rows={[
            ["Tipo", TIPO_LABELS[data.tipo]],
            ["Detalle", data.detalle],
            ["Pedido", data.pedido],
          ]}
        />

        <p className="mt-5 text-xs leading-5 text-slate-500">
          Fecha límite de respuesta (aprox.):{" "}
          {formatDate(getDeadline(registered.fecha))}.
        </p>

        <LegalNotes />
      </Card>

      <button
        type="button"
        onClick={onNew}
        className="justify-self-start text-sm font-semibold text-brand hover:underline print:hidden"
      >
        Registrar otra hoja
      </button>
    </div>
  );
}

function SummaryBlock({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="mt-6 break-inside-avoid">
      <p className="text-xs font-bold uppercase tracking-widest text-brand">
        {title}
      </p>

      <dl className="mt-2 divide-y divide-line rounded-xl border border-line text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[38%_1fr]">
            <dt className="text-slate-500">{label}</dt>
            <dd className="whitespace-pre-line break-words font-medium">
              {value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LegalNotes() {
  return (
    <ul className="mt-5 grid gap-1.5 text-xs leading-5 text-slate-500">
      <li>
        • <strong>Reclamo:</strong> {TIPO_DESCRIPCION.reclamo}
      </li>
      <li>
        • <strong>Queja:</strong> {TIPO_DESCRIPCION.queja}
      </li>
      <li>
        • La formulación del reclamo no impide acudir a otras vías de solución
        de controversias ni es requisito previo para interponer una denuncia
        ante el INDECOPI.
      </li>
      <li>
        • El proveedor deberá dar respuesta al reclamo o queja en un plazo no
        mayor a {PLAZO_DIAS_HABILES} días hábiles improrrogables.
      </li>
    </ul>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6 print:border-0 print:p-0 print:shadow-none">
      {children}
    </section>
  );
}

function SectionTitle({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-base font-bold">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs text-white">
        {number}
      </span>
      {title}
    </h2>
  );
}

function Field({
  label,
  required,
  group,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  /** true cuando contiene varios botones de opción (no un solo campo) */
  group?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const text = (
    <span className="text-xs font-medium text-slate-600">
      {label}
      {required && <span className="text-alert"> *</span>}
    </span>
  );

  if (group) {
    return (
      <div role="group" aria-label={label} className={className}>
        {text}
        {children}
      </div>
    );
  }

  return (
    <label className={`block ${className}`}>
      {text}
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium">{value || "—"}</dd>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
        selected
          ? "border-brand bg-brand/5 ring-1 ring-brand"
          : "border-line bg-bg hover:border-slate-300"
      }`}
    >
      <span className={`block font-semibold ${selected ? "text-brand" : ""}`}>
        {title}
      </span>
      {description && (
        <span className="mt-0.5 block text-xs leading-5 text-slate-500">
          {description}
        </span>
      )}
    </button>
  );
}
