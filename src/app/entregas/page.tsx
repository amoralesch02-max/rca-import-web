"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  MessageCircle,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  getSupabaseDeliveries,
  type PublicDelivery,
} from "@/lib/supabase-deliveries";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";

function formatDate(date: string) {
  if (!date) {
    return "Fecha reciente";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<PublicDelivery[]>([]);
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      const [supabaseDeliveries, supabaseSettings] = await Promise.all([
        getSupabaseDeliveries(),
        getSupabaseStoreSettings(),
      ]);

      setDeliveries(supabaseDeliveries);
      setSettings(supabaseSettings);
      setLoading(false);
    }

    loadData();
  }, []);

  const filteredDeliveries = useMemo(() => {
    if (!search.trim()) {
      return deliveries;
    }

    const query = search.toLowerCase();

    return deliveries.filter(
      (delivery) =>
        delivery.title.toLowerCase().includes(query) ||
        delivery.productName.toLowerCase().includes(query) ||
        delivery.customerName.toLowerCase().includes(query) ||
        delivery.city.toLowerCase().includes(query) ||
        delivery.description.toLowerCase().includes(query)
    );
  }, [deliveries, search]);

  const whatsappUrl = getWhatsappUrl(
    settings.whatsappMain,
    "Hola RCA IMPORT, vi las entregas realizadas en su web y estoy interesado en consultar por un producto."
  );

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <SiteHeader />

      <section className="relative overflow-hidden bg-slate-950 px-5 py-20 text-white">
        <div className="absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-red-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white hover:text-slate-950"
          >
            <ArrowLeft size={17} />
            Volver al inicio
          </Link>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_0.75fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                <PackageCheck size={16} />
                Clientes satisfechos
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                Entregas realizadas por RCA IMPORT
              </h1>

              <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-300 md:text-lg">
                Aquí mostramos algunas compras entregadas a nuestros clientes.
                Cada pedido es coordinado con atención personalizada,
                verificación del producto y comunicación directa.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E31B23] px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-700"
                >
                  <MessageCircle size={18} />
                  Consultar por WhatsApp
                </a>

                <Link
                  href="/catalogo"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  Ver catálogo
                  <Truck size={18} />
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="grid gap-4">
                <InfoItem
                  icon={ShieldCheck}
                  title="Compra segura"
                  text="Atención directa y seguimiento de tu pedido."
                />

                <InfoItem
                  icon={CheckCircle2}
                  title="Productos verificados"
                  text="Revisión del producto antes de coordinar la entrega."
                />

                <InfoItem
                  icon={Truck}
                  title="Entregas coordinadas"
                  text="Comunicación constante hasta finalizar la entrega."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
              <Search className="shrink-0 text-slate-400" size={20} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por producto, ciudad, cliente o entrega..."
                className="h-full w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 transition hover:text-[#E31B23]"
                >
                  <X size={17} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
              <PackageCheck
                className="mx-auto mb-4 animate-pulse text-[#0057A8]"
                size={48}
              />

              <p className="text-xl font-black">Cargando entregas...</p>
            </div>
          ) : filteredDeliveries.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredDeliveries.map((delivery) => (
                <article
                  key={delivery.id}
                  className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
                >
                  <div className="relative h-80 overflow-hidden bg-slate-100">
                    {delivery.imageUrl ? (
                      <img
                        src={delivery.imageUrl}
                        alt={delivery.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <PackageCheck className="text-slate-300" size={54} />
                      </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-[#E31B23] shadow-sm">
                      Entregado
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#0057A8]">
                        <MapPin size={14} />
                        {delivery.city}
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
                        <CalendarDays size={14} />
                        {formatDate(delivery.deliveredAt)}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950">
                      {delivery.title}
                    </h2>

                    <p className="mt-2 text-sm font-black text-[#E31B23]">
                      {delivery.productName}
                    </p>

                    <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">
                      {delivery.description ||
                        "Entrega realizada con coordinación directa y producto verificado."}
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-sm font-black text-slate-700">
                      <Sparkles className="text-[#0057A8]" size={18} />
                      {delivery.customerName || "Cliente RCA"}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
              <PackageCheck className="mx-auto mb-4 text-slate-300" size={54} />

              <h2 className="text-2xl font-black">
                No se encontraron entregas.
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Prueba con otra búsqueda o vuelve más tarde.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[3rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-200 md:p-12">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.35fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
                ¿Quieres hacer tu pedido?
              </p>

              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                Consulta disponibilidad y separa tu producto con RCA IMPORT.
              </h2>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
                Escríbenos por WhatsApp para consultar modelos, colores,
                precios, entregas y opciones de separación.
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E31B23] px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-700"
            >
              <MessageCircle size={18} />
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function InfoItem({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl bg-white/10 p-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0057A8]">
        <Icon size={22} />
      </div>

      <div>
        <p className="font-black">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">
          {text}
        </p>
      </div>
    </div>
  );
}