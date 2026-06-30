"use client";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  getSupabaseReservationByCode,
  type PublicReservation,
} from "@/lib/supabase-reservations";
import {
  BadgeCheck,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  Copy,
  FileCheck,
  FileSearch,
  Home,
  MapPin,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type StatusConfig = {
  label: string;
  icon: LucideIcon;
  className: string;
  title: string;
  description: string;
  step: number;
};

function getStatusConfig(status: string): StatusConfig {
  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus.includes("entregado") ||
    normalizedStatus.includes("delivered")
  ) {
    return {
      label: status,
      icon: PackageCheck,
      className: "bg-blue-50 text-[#0057A8]",
      title: "Pedido entregado",
      description:
        "El pedido figura como entregado. Gracias por comprar en RCA IMPORT.",
      step: 4,
    };
  }

  if (
    normalizedStatus.includes("enviado") ||
    normalizedStatus.includes("shipped")
  ) {
    return {
      label: status,
      icon: Truck,
      className: "bg-purple-50 text-purple-700",
      title: "Pedido en envío",
      description:
        "Tu pedido se encuentra en proceso de envío o coordinación logística.",
      step: 3,
    };
  }

  if (normalizedStatus.includes("preparando")) {
    return {
      label: status,
      icon: PackageCheck,
      className: "bg-purple-50 text-purple-700",
      title: "Pedido en preparación",
      description:
        "RCA IMPORT está preparando tu pedido o coordinando los últimos detalles.",
      step: 3,
    };
  }

  if (
    normalizedStatus.includes("confirmado") ||
    normalizedStatus.includes("reservado")
  ) {
    return {
      label: status,
      icon: BadgeCheck,
      className: "bg-green-50 text-green-700",
      title: "Pago confirmado",
      description:
        "Tu pago fue validado. RCA IMPORT continuará con la preparación o coordinación del producto.",
      step: 2,
    };
  }

  if (
    normalizedStatus.includes("rechazado") ||
    normalizedStatus.includes("cancelado")
  ) {
    return {
      label: status,
      icon: XCircle,
      className: "bg-red-50 text-[#E31B23]",
      title: "Solicitud observada",
      description:
        "La solicitud fue rechazada o cancelada. Comunícate con RCA IMPORT para más información.",
      step: 1,
    };
  }

  return {
    label: status,
    icon: Clock3,
    className: "bg-amber-50 text-amber-700",
    title: "Pendiente de confirmación",
    description:
      "Tu reserva fue registrada y está pendiente de validación manual por RCA IMPORT.",
    step: 1,
  };
}

export default function OrderStatusPage() {
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const [code, setCode] = useState("");
  const [reservation, setReservation] = useState<PublicReservation | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPage() {
      const supabaseSettings = await getSupabaseStoreSettings();
      setSettings(supabaseSettings);

      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get("codigo");

      if (codeFromUrl) {
        setCode(codeFromUrl);
        await searchReservation(codeFromUrl);
      }
    }

    loadPage();
  }, []);

  async function searchReservation(customCode?: string) {
    const reservationCode = customCode ?? code;

    if (!reservationCode.trim()) {
      return;
    }

    const cleanCode = reservationCode.trim().toUpperCase();

    setLoading(true);
    setSearched(true);
    setReservation(null);

    if (typeof window !== "undefined") {
      window.history.replaceState(
        {},
        "",
        `/estado-pedido?codigo=${encodeURIComponent(cleanCode)}`
      );
    }

    const result = await getSupabaseReservationByCode(cleanCode);

    setReservation(result);
    setLoading(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchReservation();
  }

  function copyCode() {
    if (!reservation) return;

    navigator.clipboard.writeText(reservation.id);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  const statusConfig = reservation
    ? getStatusConfig(reservation.status)
    : null;

  const StatusIcon = statusConfig?.icon ?? Clock3;

  const totalUnits = useMemo(() => {
    if (!reservation) return 0;

    return reservation.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [reservation]);

  const whatsappUrl = useMemo(() => {
    const message = reservation
      ? `Hola RCA IMPORT, quiero consultar el estado de mi reserva ${reservation.id}.`
      : "Hola RCA IMPORT, necesito ayuda para consultar el estado de mi reserva.";

    return getWhatsappUrl(settings.whatsappMain, message);
  }, [settings.whatsappMain, reservation]);

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition hover:text-[#0057A8]"
          >
            <Home size={15} />
            Inicio
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <span className="text-slate-950">Estado de pedido</span>
        </div>

        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300 md:p-12">
          <div className="absolute right-[-150px] top-[-170px] h-96 w-96 rounded-full bg-[#0057A8]/30 blur-3xl" />
          <div className="absolute bottom-[-200px] left-[-130px] h-96 w-96 rounded-full bg-[#E31B23]/25 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                <FileSearch size={16} />
                Estado de pedido
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Consulta el avance de tu reserva.
              </h1>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-300 md:text-base">
                Ingresa el código generado al separar o comprar un producto en
                RCA IMPORT. Podrás revisar estado, productos, pago y datos
                principales de tu reserva.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <ShoppingBag size={18} />
                  Ver catálogo
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700"
                >
                  <MessageCircle size={18} />
                  Ayuda por WhatsApp
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
              <FileSearch className="mb-5 text-blue-300" size={42} />

              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-200">
                Ejemplo de código
              </p>

              <p className="mt-3 text-3xl font-black">RCA-2026-1234</p>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                Este código aparece en la página de reserva confirmada.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.82fr_1fr]">
          <section className="h-fit overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm lg:sticky lg:top-32">
            <div className="border-b border-slate-200 p-6 md:p-8">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Buscar reserva
              </p>

              <h2 className="mt-3 text-3xl font-black">Ingresa tu código</h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                Copia el código exacto de tu reserva para consultar el avance.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8">
              <label className="text-sm font-black text-slate-700">
                Código de reserva
              </label>

              <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
                <FileSearch className="shrink-0 text-slate-400" size={20} />

                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="Ejemplo: RCA-2026-1234"
                  className="h-full w-full bg-transparent text-sm font-black uppercase outline-none placeholder:text-slate-400"
                />

                {code && (
                  <button
                    type="button"
                    onClick={() => {
                      setCode("");
                      setReservation(null);
                      setSearched(false);
                      window.history.replaceState({}, "", "/estado-pedido");
                    }}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 transition hover:text-[#E31B23]"
                  >
                    <XCircle size={17} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-6 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={18} />
                ) : (
                  <Search size={18} />
                )}

                {loading ? "Buscando..." : "Buscar reserva"}
              </button>

              <div className="mt-6 rounded-[1.5rem] bg-blue-50 p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="shrink-0 text-[#0057A8]" />

                  <p className="text-sm font-semibold leading-6 text-slate-600">
                    La consulta se realiza directamente en Supabase usando el
                    código de reserva. Si no encuentras tu código, comunícate
                    por WhatsApp con RCA IMPORT.
                  </p>
                </div>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                <MessageCircle size={18} />
                Contactar a RCA IMPORT
              </a>
            </form>
          </section>

          <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
            {!searched && !loading && (
              <EmptyState
                icon={FileSearch}
                title="Esperando código de reserva"
                text="Escribe tu código para revisar el estado, productos, monto y datos principales de tu reserva."
              />
            )}

            {loading && (
              <EmptyState
                icon={RefreshCw}
                title="Buscando reserva..."
                text="Consultando información en Supabase."
                spinning
              />
            )}

            {searched && !loading && !reservation && (
              <div>
                <div className="bg-slate-950 p-10 text-center text-white">
                  <XCircle className="mx-auto mb-4 text-red-300" size={58} />

                  <p className="text-3xl font-black">Reserva no encontrada</p>

                  <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-300">
                    Verifica que el código esté escrito correctamente. También
                    puedes contactar a RCA IMPORT por WhatsApp.
                  </p>
                </div>

                <div className="grid gap-3 p-6 sm:grid-cols-2">
                  <Link
                    href="/catalogo"
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-6 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    <ShoppingBag size={18} />
                    Ver catálogo
                  </Link>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </a>
                </div>
              </div>
            )}

            {reservation && statusConfig && (
              <div>
                <div className="border-b border-slate-200 p-6 md:p-8">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black ${statusConfig.className}`}
                  >
                    <StatusIcon size={16} />
                    {statusConfig.label}
                  </div>

                  <h2 className="mt-5 text-4xl font-black">
                    {statusConfig.title}
                  </h2>

                  <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">
                    {statusConfig.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={copyCode}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                    >
                      <Copy size={17} />
                      {copied ? "Código copiado" : reservation.id}
                    </button>

                    <Link
                      href={`/reserva-confirmada?codigo=${reservation.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                    >
                      Ver detalle completo
                      <ChevronRight size={17} />
                    </Link>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <StatusTimeline currentStep={statusConfig.step} />

                  <div className="mt-7 grid gap-4 md:grid-cols-2">
                    <InfoCard
                      title="Código"
                      value={reservation.id}
                      icon={FileSearch}
                    />

                    <InfoCard
                      title="Cliente"
                      value={reservation.customerName}
                      icon={UserRound}
                    />

                    <InfoCard
                      title="Celular"
                      value={reservation.phone}
                      icon={MessageCircle}
                    />

                    <InfoCard
                      title="Operación"
                      value={reservation.operationType}
                      icon={ClipboardCheck}
                    />

                    <InfoCard
                      title="Pago declarado"
                      value={`S/ ${reservation.amountPaid}`}
                      icon={Wallet}
                    />

                    <InfoCard
                      title="Total"
                      value={`S/ ${reservation.total}`}
                      icon={Wallet}
                    />

                    <InfoCard
                      title="Productos"
                      value={reservation.items.length}
                      icon={ShoppingBag}
                    />

                    <InfoCard
                      title="Unidades"
                      value={totalUnits}
                      icon={PackageCheck}
                    />
                  </div>

                  <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-5">
                    <div className="flex gap-3">
                      <MapPin className="shrink-0 text-[#0057A8]" />

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Dirección registrada
                        </p>

                        <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                          {reservation.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
                    <div className="flex gap-3">
                      <FileCheck className="shrink-0 text-[#0057A8]" />

                      <div>
                        <p className="font-black text-[#0057A8]">
                          Comprobante registrado
                        </p>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                          {reservation.paymentProofName
                            ? `Archivo recibido: ${reservation.paymentProofName}`
                            : "El comprobante fue recibido para validación interna."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#E31B23]">
                      Productos
                    </p>

                    <div className="mt-4 grid gap-3">
                      {reservation.items.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-4"
                        >
                          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                            <div>
                              <p className="font-black">{item.productName}</p>

                              <p className="mt-1 text-sm font-semibold text-slate-500">
                                Color: {item.variant || "Color único"} · Cantidad:{" "}
{item.quantity}
                              </p>
                            </div>

                            <p className="font-black text-[#0057A8]">
                              S/ {item.price * item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-[#0057A8]"
                  >
                    <MessageCircle size={18} />
                    Consultar esta reserva por WhatsApp
                  </a>
                </div>
              </div>
            )}
          </section>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            {
              title: "Registrado",
              text: "El cliente envía sus datos y pago.",
              icon: FileSearch,
            },
            {
              title: "Validación",
              text: "RCA IMPORT revisa el comprobante.",
              icon: Wallet,
            },
            {
              title: "Confirmación",
              text: "Se confirma por WhatsApp.",
              icon: BadgeCheck,
            },
            {
              title: "Entrega",
              text: "Se coordina recojo o envío.",
              icon: Truck,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8]">
                <item.icon size={25} />
              </div>

              <h3 className="mt-4 text-xl font-black">{item.title}</h3>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {item.text}
              </p>
            </div>
          ))}
        </section>
      </section>

      <SiteFooter />
    </main>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
  spinning = false,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  spinning?: boolean;
}) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),radial-gradient(circle_at_bottom_right,#fee2e2,transparent_35%)] p-10 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white text-[#0057A8] shadow-xl shadow-slate-200">
        <Icon className={spinning ? "animate-spin" : ""} size={54} />
      </div>

      <p className="mt-6 text-3xl font-black">{title}</p>

      <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-5">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8]">
          <Icon size={21} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>

          <p className="mt-2 truncate text-sm font-black text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusTimeline({ currentStep }: { currentStep: number }) {
  const steps = [
    {
      title: "Registrado",
      description: "Reserva recibida",
      icon: FileSearch,
    },
    {
      title: "Validado",
      description: "Pago confirmado",
      icon: BadgeCheck,
    },
    {
      title: "Preparación",
      description: "Pedido coordinado",
      icon: PackageCheck,
    },
    {
      title: "Entrega",
      description: "Recojo o envío",
      icon: Truck,
    },
  ];

  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="text-[#0057A8]" size={20} />

        <p className="font-black">Avance de la reserva</p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const active = stepNumber <= currentStep;
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className={`rounded-[1.4rem] border p-4 transition ${
                active
                  ? "border-[#0057A8] bg-blue-50"
                  : "border-slate-200 bg-[#f6f8fc]"
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  active
                    ? "bg-[#0057A8] text-white"
                    : "bg-white text-slate-400"
                }`}
              >
                <Icon size={21} />
              </div>

              <p
                className={`mt-3 font-black ${
                  active ? "text-[#0057A8]" : "text-slate-500"
                }`}
              >
                {step.title}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-500">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}