"use client";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  getSupabaseDeliveries,
  type PublicDelivery,
} from "@/lib/supabase-deliveries";
import { getSupabaseProducts } from "@/lib/supabase-products";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Headphones,
  MapPin,
  PackageCheck,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const container = "mx-auto max-w-7xl px-5 md:px-6";

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

export default function AboutPage() {
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [deliveries, setDeliveries] = useState<PublicDelivery[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState("Todas");
  const [selected, setSelected] = useState<PublicDelivery | null>(null);

  useEffect(() => {
    async function loadData() {
      const [supabaseSettings, supabaseDeliveries, supabaseProducts] =
        await Promise.all([
          getSupabaseStoreSettings(),
          getSupabaseDeliveries(),
          getSupabaseProducts(),
        ]);

      setSettings(supabaseSettings);
      setDeliveries(supabaseDeliveries);
      setProductCount(supabaseProducts.length);
      setLoading(false);
    }

    loadData();
  }, []);

  // Cerrar la imagen ampliada con Escape
  useEffect(() => {
    if (!selected) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selected]);

  const cities = useMemo(() => {
    return Array.from(
      new Set(deliveries.map((delivery) => delivery.city).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [deliveries]);

  const visibleDeliveries = useMemo(() => {
    if (cityFilter === "Todas") {
      return deliveries;
    }

    return deliveries.filter((delivery) => delivery.city === cityFilter);
  }, [deliveries, cityFilter]);

  const whatsappUrl = useMemo(() => {
    return getWhatsappUrl(
      settings.whatsappMain,
      "Hola RCA IMPORT, vi las reseñas en su web y quisiera consultar por un producto."
    );
  }, [settings.whatsappMain]);

  const stats = [
    { value: deliveries.length, label: "Entregas verificadas" },
    { value: cities.length, label: "Ciudades atendidas" },
    { value: productCount, label: "Productos en catálogo" },
  ].filter((item) => item.value > 0);

  const values = [
    {
      icon: PackageCheck,
      title: "Productos seleccionados",
      text: "Tecnología importada y accesorios, con el stock actualizado en el catálogo.",
    },
    {
      icon: Headphones,
      title: "Atención personalizada",
      text: "Te asesoramos por WhatsApp antes de comprar y coordinamos cada pedido contigo.",
    },
    {
      icon: Truck,
      title: "Envíos a todo el Perú",
      text: settings.shippingMessage,
    },
    {
      icon: Wallet,
      title: "Pagos claros",
      text: settings.paymentMessage,
    },
  ];

  return (
    <main className="min-h-screen bg-bg text-slate-950">
      <SiteHeader />

      {/* ================= ENCABEZADO ================= */}
      <section className="hero-bg hero-grid border-b border-slate-800 text-white">
        <div className={`${container} relative z-10 py-14 text-center md:py-20`}>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl">
            Conoce a{" "}
            <span className="underline decoration-alert decoration-4 underline-offset-8">
              {settings.storeName}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-blue-100">
            {settings.slogan}. Tecnología importada, accesorios y ventas al por
            mayor, con envíos a todo el Perú y atención directa por WhatsApp.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#resenas"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand shadow-lg shadow-slate-950/20 transition hover:bg-blue-50"
            >
              Ver reseñas
              <ChevronRight size={16} />
            </a>

            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-full bg-alert px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-alert-hover"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* ================= NÚMEROS (datos reales) ================= */}
      {!loading && stats.length > 0 && (
        <section className={`${container} -mt-8 relative z-20`}>
          <div
            className="grid gap-4 rounded-2xl border border-line bg-white p-6 shadow-lg shadow-slate-200/60"
            style={{
              gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
            }}
          >
            {stats.map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-3xl font-bold text-brand md:text-4xl">
                  {item.value}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500 md:text-sm">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= CÓMO TRABAJAMOS ================= */}
      <section className={`${container} py-14`}>
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Nuestra forma de trabajar
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Lo que puedes esperar al comprar con nosotros.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-line bg-white p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-brand">
                <item.icon size={20} />
              </div>

              <h3 className="mt-4 text-base font-semibold">{item.title}</h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= RESEÑAS ================= */}
      <section
        id="resenas"
        className="scroll-mt-28 border-t border-line bg-white py-14"
      >
        <div className={container}>
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-widest text-alert">
              Clientes felices
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Reseñas de clientes
            </h2>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Entregas reales: así reciben su compra quienes confían en{" "}
              {settings.storeName}.
            </p>
          </div>

          {/* Filtro por ciudad */}
          {cities.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {["Todas", ...cities].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setCityFilter(city)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    cityFilter === city
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-white text-slate-600 hover:border-brand hover:text-brand"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="mt-8 rounded-2xl border border-line bg-bg p-10 text-center text-sm text-slate-500">
              Cargando reseñas...
            </div>
          ) : visibleDeliveries.length > 0 ? (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {visibleDeliveries.map((delivery) => (
                <article
                  key={delivery.id}
                  className="group overflow-hidden rounded-2xl border border-line bg-bg transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-slate-200"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(delivery)}
                    aria-label={`Ampliar imagen: ${delivery.title}`}
                    className="relative block h-64 w-full overflow-hidden bg-surface-2"
                  >
                    {delivery.imageUrl ? (
                      <img
                        src={delivery.imageUrl}
                        alt={delivery.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <PackageCheck className="text-slate-300" size={48} />
                      </span>
                    )}

                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-alert shadow-sm">
                      <BadgeCheck size={13} />
                      Entrega verificada
                    </span>
                  </button>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold leading-snug">
                      {delivery.title}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-alert">
                      {delivery.productName}
                    </p>

                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-500">
                      {delivery.description ||
                        "Entrega realizada con coordinación directa y producto verificado."}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">
                        {delivery.customerName || "Cliente RCA"}
                      </span>

                      {delivery.city && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={12} />
                          {delivery.city}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={12} />
                        {formatDate(delivery.deliveredAt)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-line bg-bg p-10 text-center">
              <PackageCheck className="mx-auto mb-4 text-slate-300" size={44} />

              <p className="text-lg font-semibold">
                Pronto compartiremos las entregas de nuestros clientes.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Mientras tanto, puedes escribirnos y resolver tus dudas.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className={`${container} py-14`}>
        <div className="cta-gradient flex flex-col items-start justify-between gap-6 rounded-3xl p-8 text-white md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">
              ¿Quieres ser el próximo cliente feliz?
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
              Escríbenos por WhatsApp y te ayudamos a elegir el producto ideal.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
          >
            <WhatsAppIcon size={17} />
            Hablar con un asesor
          </a>
        </div>
      </section>

      {/* ================= IMAGEN AMPLIADA ================= */}
      {selected && (
        <div
          className="animate-fade-in fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4"
          role="dialog"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Cerrar imagen"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg"
          >
            <X size={20} />
          </button>

          <div
            className="max-h-full w-full max-w-3xl overflow-hidden rounded-2xl bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            {selected.imageUrl && (
              <img
                src={selected.imageUrl}
                alt={selected.title}
                className="max-h-[70vh] w-full bg-slate-100 object-contain"
              />
            )}

            <div className="p-5">
              <p className="text-base font-semibold">{selected.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {selected.customerName || "Cliente RCA"}
                {selected.city ? ` · ${selected.city}` : ""} ·{" "}
                {formatDate(selected.deliveredAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </main>
  );
}
