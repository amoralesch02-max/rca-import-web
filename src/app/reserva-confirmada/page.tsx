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
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  FileText,
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
import { useEffect, useMemo, useState } from "react";

function getStatusStyle(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("confirmado") || normalized.includes("reservado")) {
    return "bg-green-50 text-green-700";
  }

  if (normalized.includes("entregado")) {
    return "bg-blue-50 text-[#0057A8]";
  }

  if (normalized.includes("enviado") || normalized.includes("preparando")) {
    return "bg-purple-50 text-purple-700";
  }

  if (normalized.includes("rechazado") || normalized.includes("cancelado")) {
    return "bg-red-50 text-[#E31B23]";
  }

  return "bg-amber-50 text-amber-700";
}

export default function ReservationConfirmedPage() {
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const [reservation, setReservation] = useState<PublicReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadPageData() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("codigo");

      const supabaseSettings = await getSupabaseStoreSettings();
      setSettings(supabaseSettings);

      if (!code) {
        setLoading(false);
        return;
      }

      const supabaseReservation = await getSupabaseReservationByCode(code);

      setReservation(supabaseReservation);
      setLoading(false);
    }

    loadPageData();
  }, []);

  const totalUnits = useMemo(() => {
    if (!reservation) {
      return 0;
    }

    return reservation.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [reservation]);

  const whatsappUrl = useMemo(() => {
    const message = reservation
      ? `Hola RCA IMPORT, acabo de registrar mi reserva con código ${reservation.id}. Quisiera confirmar la validación del pago y el siguiente paso.`
      : "Hola RCA IMPORT, necesito ayuda con mi reserva.";

    return getWhatsappUrl(settings.whatsappMain, message);
  }, [settings.whatsappMain, reservation]);

  function copyCode() {
    if (!reservation) return;

    navigator.clipboard.writeText(reservation.id);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

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

          <Link href="/catalogo" className="transition hover:text-[#0057A8]">
            Catálogo
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <span className="text-slate-950">Reserva confirmada</span>
        </div>

        {loading ? (
          <section className="rounded-[2.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <RefreshCw
              className="mx-auto mb-4 animate-spin text-[#0057A8]"
              size={46}
            />

            <p className="text-xl font-black">
              Cargando reserva desde Supabase...
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Estamos verificando la información registrada.
            </p>
          </section>
        ) : reservation ? (
          <>
            <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300 md:p-12">
              <div className="absolute right-[-150px] top-[-170px] h-96 w-96 rounded-full bg-[#0057A8]/30 blur-3xl" />
              <div className="absolute bottom-[-200px] left-[-130px] h-96 w-96 rounded-full bg-green-500/20 blur-3xl" />

              <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-center">
                <div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-green-500/15 text-green-300">
                    <BadgeCheck size={42} />
                  </div>

                  <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-green-300">
                    Reserva registrada
                  </p>

                  <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                    Tu solicitud fue guardada correctamente.
                  </h1>

                  <p className="mt-6 max-w-2xl text-sm font-semibold leading-7 text-slate-300 md:text-base">
                    El equipo de RCA IMPORT validará el pago y confirmará la
                    reserva por WhatsApp. Guarda tu código para revisar el estado
                    de tu pedido.
                  </p>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={copyCode}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                    >
                      <Copy size={18} />
                      {copied ? "Código copiado" : reservation.id}
                    </button>

                    <Link
                      href={`/estado-pedido?codigo=${reservation.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700"
                    >
                      <Search size={18} />
                      Ver estado
                    </Link>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-green-950/20 transition hover:bg-green-700"
                    >
                      <MessageCircle size={18} />
                      WhatsApp
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <HeroStat title="Productos" value={reservation.items.length} />
                  <HeroStat title="Unidades" value={totalUnits} />
                  <HeroStat title="Total" value={`S/ ${reservation.total}`} large />
                  <HeroStat title="Estado" value="Pendiente" />
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.76fr]">
              <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-6 md:p-8">
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                    Detalle de reserva
                  </p>

                  <h2 className="mt-3 text-3xl font-black">
                    Información registrada
                  </h2>

                  <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                    Estos son los datos guardados para la validación de tu
                    reserva.
                  </p>
                </div>

                <div className="p-6 md:p-8">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard
                      title="Cliente"
                      value={reservation.customerName}
                      icon={UserRound}
                    />

                    <InfoCard
                      title="Documento"
                      value={reservation.documentNumber}
                      icon={FileText}
                    />

                    <InfoCard
                      title="Celular"
                      value={reservation.phone}
                      icon={MessageCircle}
                    />

                    <InfoCard
                      title="Ubicación"
                      value={`${reservation.city}, ${reservation.department}`}
                      icon={MapPin}
                    />

                    <InfoCard
                      title="Operación"
                      value={reservation.operationType}
                      icon={ClipboardCheck}
                    />

                    <InfoCard
                      title="Método de pago"
                      value={reservation.paymentMethod}
                      icon={Wallet}
                    />

                    <InfoCard
                      title="Monto pagado"
                      value={`S/ ${reservation.amountPaid}`}
                      icon={Wallet}
                    />

                    <div className="rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-5">
                      <div className="flex gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                          <Clock3 size={21} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Estado
                          </p>

                          <span
                            className={`mt-2 inline-flex rounded-full px-3 py-2 text-xs font-black ${getStatusStyle(
                              reservation.status
                            )}`}
                          >
                            {reservation.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-5">
                    <div className="flex gap-3">
                      <MapPin className="shrink-0 text-[#0057A8]" />

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                          Dirección
                        </p>

                        <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                          {reservation.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5">
                    <div className="flex gap-3">
                      <ShieldCheck className="shrink-0 text-[#0057A8]" />

                      <div>
                        <p className="font-black text-[#0057A8]">
                          Comprobante recibido
                        </p>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                          {reservation.paymentProofName
                            ? `Archivo registrado: ${reservation.paymentProofName}`
                            : "El comprobante fue registrado para validación interna."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <aside className="grid h-fit gap-5 lg:sticky lg:top-32">
                <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 p-6">
                    <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                      Productos
                    </p>

                    <h2 className="mt-3 text-3xl font-black">Resumen</h2>
                  </div>

                  <div className="grid gap-3 p-6">
                    {reservation.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-4"
                      >
                        <p className="font-black">{item.productName}</p>

                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Color: {item.variant || "Color único"} · Cantidad:{" "}
{item.quantity}
                        </p>

                        <p className="mt-2 font-black text-[#0057A8]">
                          S/ {item.price * item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 pt-0">
                    <div className="rounded-[1.7rem] bg-slate-950 p-6 text-white">
                      <p className="text-sm font-bold text-slate-300">
                        Total registrado
                      </p>

                      <p className="mt-2 text-5xl font-black">
                        S/ {reservation.total}
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white/10 p-3">
                          <p className="text-xs text-slate-400">Pagado</p>
                          <p className="mt-1 font-black text-white">
                            S/ {reservation.amountPaid}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white/10 p-3">
                          <p className="text-xs text-slate-400">Unidades</p>
                          <p className="mt-1 font-black text-white">
                            {totalUnits}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-200">
                  <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
                    Próximo paso
                  </p>

                  <div className="mt-5 grid gap-4">
                    {[
                      {
                        icon: Clock3,
                        text: "La reserva queda pendiente de validación.",
                      },
                      {
                        icon: Wallet,
                        text: "El pago será revisado manualmente por el administrador.",
                      },
                      {
                        icon: MessageCircle,
                        text: "RCA IMPORT se comunicará contigo por WhatsApp.",
                      },
                      {
                        icon: PackageCheck,
                        text: "Cuando el pago sea confirmado, el pedido avanzará de estado.",
                      },
                    ].map((item) => (
                      <div key={item.text} className="flex gap-3">
                        <item.icon className="shrink-0 text-blue-300" />

                        <p className="text-sm font-semibold leading-6 text-slate-300">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                  >
                    <MessageCircle size={18} />
                    Contactar por WhatsApp
                  </a>
                </section>
              </aside>
            </section>

            <section className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: "Consulta tu estado",
                  text: "Usa tu código para revisar el avance de la reserva.",
                },
                {
                  icon: Truck,
                  title: "Coordina el envío",
                  text: "La entrega se confirma por WhatsApp según ciudad y disponibilidad.",
                },
                {
                  icon: ShieldCheck,
                  title: "Validación segura",
                  text: "El comprobante queda guardado de forma privada para el administrador.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8]">
                      <item.icon size={23} />
                    </div>

                    <div>
                      <p className="font-black">{item.title}</p>

                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-[#0057A8]"
              >
                <ChevronLeft size={18} />
                Volver al catálogo
              </Link>

              <Link
                href={`/estado-pedido?codigo=${reservation.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                <Search size={18} />
                Ver estado del pedido
              </Link>
            </div>
          </>
        ) : (
          <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-950 p-10 text-center text-white">
              <XCircle className="mx-auto mb-4 text-red-300" size={58} />

              <p className="text-3xl font-black">No se encontró la reserva</p>

              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-300">
                Verifica que el código sea correcto o registra una nueva reserva
                desde el carrito.
              </p>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <Link
                href="/estado-pedido"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-6 text-sm font-black text-white transition hover:bg-blue-700"
              >
                <Search size={18} />
                Buscar estado de pedido
              </Link>

              <Link
                href="/catalogo"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                <ShoppingBag size={18} />
                Ver catálogo
              </Link>
            </div>
          </section>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}

function HeroStat({
  title,
  value,
  large = false,
}: {
  title: string;
  value: string | number;
  large?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur ${
        large ? "col-span-2" : ""
      }`}
    >
      <Sparkles className="text-blue-200" size={24} />

      <p className="mt-4 truncate text-3xl font-black">{value}</p>

      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
        {title}
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