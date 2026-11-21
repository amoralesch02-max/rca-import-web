"use client";

import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  getSupabaseDeliveries,
  type PublicDelivery,
} from "@/lib/supabase-deliveries";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  X,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const container = "mx-auto max-w-7xl px-5 md:px-6";

function formatDate(date: string, month: "short" | "long" = "short") {
  if (!date) {
    return "";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("es-PE", {
    day: "2-digit",
    month,
    year: "numeric",
  });
}

export default function AboutPage() {
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [deliveries, setDeliveries] = useState<PublicDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  // Posición de la foto ampliada (null = cerrada)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selected = selectedIndex === null ? null : deliveries[selectedIndex] ?? null;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function closeViewer() {
    setSelectedIndex(null);
  }

  function showOffset(offset: number) {
    setSelectedIndex((current) =>
      current === null
        ? current
        : (current + offset + deliveries.length) % deliveries.length
    );
  }

  useEffect(() => {
    async function loadData() {
      const [supabaseSettings, supabaseDeliveries] = await Promise.all([
        getSupabaseStoreSettings(),
        getSupabaseDeliveries(),
      ]);

      setSettings(supabaseSettings);
      setDeliveries(supabaseDeliveries);
      setLoading(false);
    }

    loadData();
  }, []);

  // Teclado en la imagen ampliada: Escape cierra, flechas pasan de foto
  const viewerOpen = selectedIndex !== null;

  useEffect(() => {
    if (!viewerOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedIndex(null);
      } else if (event.key === "ArrowRight") {
        showOffset(1);
      } else if (event.key === "ArrowLeft") {
        showOffset(-1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
    // showOffset solo usa setState con función: no necesita ser dependencia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewerOpen]);

  const whatsappUrl = useMemo(() => {
    return getWhatsappUrl(
      settings.whatsappMain,
      "Hola RCA IMPORT, vi las reseñas en su web y quisiera consultar por un producto."
    );
  }, [settings.whatsappMain]);

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

      {/* ================= ENTREGAS ================= */}
      <section id="resenas" className="scroll-mt-28 bg-white py-14">
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

          {loading ? (
            <div className="mt-8 rounded-2xl border border-line bg-bg p-10 text-center text-sm text-slate-500">
              Cargando reseñas...
            </div>
          ) : deliveries.length > 0 ? (
            /* Mosaico: cada foto conserva su proporción original */
            <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
              {deliveries.map((delivery, index) => (
                <Reveal
                  key={delivery.id}
                  delay={(index % 3) * 0.08}
                  className="mb-4 break-inside-avoid"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(index)}
                    aria-label="Ampliar imagen de la entrega"
                    className="group relative block w-full overflow-hidden rounded-2xl border border-line bg-surface-2 text-left shadow-sm transition hover:border-brand/40 hover:shadow-xl hover:shadow-slate-200"
                  >
                    {delivery.imageUrl ? (
                      <img
                        src={delivery.imageUrl}
                        alt={delivery.title || "Entrega verificada"}
                        loading="lazy"
                        className="block h-auto w-full transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="flex aspect-[4/3] w-full items-center justify-center">
                        <PackageCheck className="text-slate-300" size={48} />
                      </span>
                    )}

                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-alert shadow-sm">
                      <BadgeCheck size={13} />
                      Entrega verificada
                    </span>

                    {delivery.deliveredAt && (
                      <span className="absolute bottom-3 left-3 rounded-md bg-slate-950/75 px-2.5 py-1 text-[11px] font-semibold text-white">
                        {formatDate(delivery.deliveredAt)}
                      </span>
                    )}
                  </button>
                </Reveal>
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
      {selected && selectedIndex !== null && (
        <div
          className="animate-fade-in fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4"
          role="dialog"
          aria-label="Entrega verificada"
          onClick={closeViewer}
        >
          <button
            type="button"
            onClick={closeViewer}
            aria-label="Cerrar imagen"
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg"
          >
            <X size={20} />
          </button>

          {deliveries.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showOffset(-1);
                }}
                aria-label="Entrega anterior"
                className="absolute left-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-lg transition hover:bg-white sm:flex md:left-6"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showOffset(1);
                }}
                aria-label="Entrega siguiente"
                className="absolute right-3 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-950 shadow-lg transition hover:bg-white sm:flex md:right-6"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div
            className="max-h-full w-full max-w-3xl overflow-hidden rounded-2xl bg-white"
            onClick={(event) => event.stopPropagation()}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              touchStart.current = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchEnd={(event) => {
              const start = touchStart.current;
              touchStart.current = null;

              if (!start || deliveries.length < 2) return;

              const touch = event.changedTouches[0];
              const dx = touch.clientX - start.x;
              const dy = touch.clientY - start.y;

              // Deslizar a los lados (celular) pasa de foto
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
                showOffset(dx < 0 ? 1 : -1);
              }
            }}
          >
            {selected.imageUrl && (
              <img
                key={selected.id}
                src={selected.imageUrl}
                alt={selected.title || "Entrega verificada"}
                className="animate-fade-in max-h-[74vh] w-full bg-slate-100 object-contain"
              />
            )}

            <div className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-alert">
                <BadgeCheck size={16} />
                Entrega verificada
              </span>

              <span className="flex items-center gap-3 text-slate-500">
                {selected.deliveredAt && formatDate(selected.deliveredAt, "long")}

                {deliveries.length > 1 && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {selectedIndex + 1}/{deliveries.length}
                  </span>
                )}
              </span>
            </div>
          </div>

          {deliveries.length > 1 && (
            <p className="pointer-events-none absolute bottom-4 left-0 right-0 text-center text-xs font-medium text-white/70 sm:hidden">
              Desliza para ver más entregas
            </p>
          )}
        </div>
      )}

      <SiteFooter />
    </main>
  );
}
