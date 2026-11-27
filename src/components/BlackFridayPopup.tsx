"use client";

import ProductImage from "@/components/ProductImage";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { CAMPAIGN, isIphoneProduct } from "@/lib/campaign";
import { getBestOffer } from "@/lib/product-options";
import { getWhatsappUrl } from "@/lib/store-settings";
import { getSupabaseProducts, type PublicProduct } from "@/lib/supabase-products";
import { useStoreSettings } from "@/lib/use-store-settings";
import { ChevronRight, X, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type PointerEvent, useEffect, useRef, useState } from "react";

/**
 * Pop-up de Black Friday.
 *
 * - Aparece solo entre START y END (hora de Perú) y se oculta solo al terminar.
 * - Se muestra una vez al día por navegador, poco después de entrar.
 * - El "Hasta -X%" y los productos salen de las ofertas reales del catálogo.
 *   Primero los iPhones (de mayor a menor descuento) y luego lo demás.
 * - Efectos: cinta de texto que corre arriba, producto destacado que va
 *   cambiando solo, y una luz dorada + inclinación 3D que siguen al mouse.
 * - No aparece en el panel admin.
 * - Para verlo antes de tiempo (prueba): agrega ?bf=1 a la dirección.
 *
 * Para otra campaña, cambia las fechas y los textos de abajo.
 */
// Mismas fechas que el descuento de campaña (lib/campaign.ts)
const START = CAMPAIGN.start;
const END = CAMPAIGN.end;
const END_LABEL = "el lunes 30";
const SEEN_KEY = "rca_bf_popup_2026";
const SHOW_DELAY = 1200;
const ROTATE_EVERY = 3500; // ms entre un producto destacado y el siguiente
const MAX_DEALS = 7; // entran en una sola fila de miniaturas

/**
 * Productos del pop-up: solo iPhones NUEVOS (nada de seminuevos).
 * Primero estos modelos, en este orden, y luego otros iPhone "Pro Max"
 * nuevos, del más nuevo al más antiguo.
 */
const PRIORITY_MODELS = [
  /\bduo\b/i, // iPhone Duo
  /18\s*pro\s*max/i,
  /18\s*pro(?!\s*max)/i,
  /17\s*pro\s*max/i,
];

function isSeminuevo(product: PublicProduct) {
  return /semi\s*-?\s*nuevo/i.test(`${product.condition} ${product.name}`);
}

/** ¿Va en el pop-up? Modelos prioritarios u otros iPhone Pro Max, siempre nuevos */
function isFeaturedDeal(product: PublicProduct) {
  if (isSeminuevo(product) || !isIphoneProduct(product)) {
    return false;
  }

  return (
    PRIORITY_MODELS.some((pattern) => pattern.test(product.name)) ||
    /pro\s*max/i.test(product.name)
  );
}

function dealRank(product: PublicProduct) {
  const priority = PRIORITY_MODELS.findIndex((pattern) => pattern.test(product.name));

  if (priority !== -1) {
    return priority;
  }

  if (isIphoneProduct(product)) {
    // iPhone 17 → 100 - 17 = 83: los modelos más nuevos quedan antes
    const model = Number(product.name.match(/iphone\s*(\d{1,2})/i)?.[1] ?? 0);
    return 100 - model;
  }

  return 1000;
}

type Deal = {
  product: PublicProduct;
  percent: number;
  price: number;
  salePrice: number;
};

function todayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Lima" });
}

function getTimeLeft() {
  const total = Math.max(0, Math.floor((END.getTime() - Date.now()) / 1000));

  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function BlackFridayPopup() {
  const pathname = usePathname();
  const settings = useStoreSettings();

  const [open, setOpen] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [maxPercent, setMaxPercent] = useState(0);
  const [productsOnSale, setProductsOnSale] = useState(0);
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const frame = useRef(0);

  // ¿Toca mostrarlo?
  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      return;
    }

    const preview = new URLSearchParams(window.location.search).get("bf") === "1";
    const now = Date.now();
    const inCampaign = now >= START.getTime() && now < END.getTime();

    if (!preview && !inCampaign) {
      return;
    }

    if (!preview) {
      try {
        if (localStorage.getItem(SEEN_KEY) === todayKey()) {
          return;
        }
      } catch {
        // Sin almacenamiento disponible: se muestra igual
      }
    }

    let cancelled = false;

    // Ofertas reales del catálogo: iPhones primero, luego por mayor descuento
    getSupabaseProducts()
      .then((products) => {
        if (cancelled) return;

        const list = products
          .map((product) => {
            const offer = getBestOffer(product);
            return offer ? { product, ...offer } : null;
          })
          .filter((item): item is Deal => item !== null && item.percent > 0);

        const featuredList = list.filter((item) => isFeaturedDeal(item.product));

        // Si todavía no hay ningún Pro Max en oferta, se muestran las demás ofertas nuevas
        const showcase =
          featuredList.length > 0
            ? featuredList
            : list.filter((item) => !isSeminuevo(item.product));

        const sorted = [...showcase].sort((a, b) => {
          const rankOrder = dealRank(a.product) - dealRank(b.product);
          return rankOrder !== 0 ? rankOrder : b.percent - a.percent;
        });

        setProductsOnSale(list.length);
        setMaxPercent(list.reduce((max, item) => Math.max(max, item.percent), 0));
        setDeals(sorted.slice(0, MAX_DEALS));
      })
      .catch(() => undefined);

    const timer = window.setTimeout(() => {
      if (cancelled) return;

      previousFocus.current = document.activeElement as HTMLElement | null;
      setTimeLeft(getTimeLeft());
      setOpen(true);

      try {
        localStorage.setItem(SEEN_KEY, todayKey());
      } catch {
        // Sin almacenamiento: no pasa nada
      }
    }, SHOW_DELAY);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // Solo al entrar a la web (no en cada cambio de página)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mientras está abierto: Escape cierra, el fondo no se desplaza y el reloj avanza
  useEffect(() => {
    if (!open) {
      return;
    }

    closeRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const clock = window.setInterval(() => setTimeLeft(getTimeLeft()), 1000);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      window.clearInterval(clock);
      window.cancelAnimationFrame(frame.current);
      previousFocus.current?.focus?.();
    };
  }, [open]);

  // El producto destacado cambia solo (se pausa con el mouse encima)
  useEffect(() => {
    if (!open || paused || deals.length < 2 || prefersReducedMotion()) {
      return;
    }

    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % deals.length),
      ROTATE_EVERY
    );

    return () => window.clearInterval(timer);
  }, [open, paused, deals.length]);

  // Luz dorada e inclinación 3D que siguen al mouse (sin volver a dibujar React)
  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || prefersReducedMotion()) {
      return;
    }

    const modal = modalRef.current;
    if (!modal) return;

    const rect = modal.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    window.cancelAnimationFrame(frame.current);
    frame.current = window.requestAnimationFrame(() => {
      modal.style.setProperty("--mx", `${x * 100}%`);
      modal.style.setProperty("--my", `${y * 100}%`);
      modal.style.setProperty("--px", (x - 0.5).toFixed(3));
      modal.style.setProperty("--py", (y - 0.5).toFixed(3));
      modal.style.setProperty("--glow", "1");
    });
  }

  function handlePointerLeave() {
    const modal = modalRef.current;
    if (!modal) return;

    window.cancelAnimationFrame(frame.current);
    modal.style.setProperty("--px", "0");
    modal.style.setProperty("--py", "0");
    modal.style.setProperty("--glow", "0");
  }

  if (!open) {
    return null;
  }

  const featured = deals[active] ?? deals[0];
  const whatsappUrl = getWhatsappUrl(
    settings.whatsappMain,
    "Hola RCA IMPORT, vi las ofertas de Black Friday en su web. ¿Me pueden dar más información?"
  );

  const tickerText = [
    "Black Friday",
    maxPercent > 0 ? `Hasta -${maxPercent}%` : "Precios especiales",
    "iPhones y accesorios",
    "Envíos a todo el Perú",
    `Solo hasta ${END_LABEL}`,
  ];

  return (
    <div
      className="bf-backdrop fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => setOpen(false)}
    >
      <style>{BF_CSS}</style>

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bf-title"
        onClick={(event) => event.stopPropagation()}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="bf-pop bf-modal relative w-full max-w-3xl overflow-hidden rounded-t-3xl bg-[#09090c] text-white shadow-2xl shadow-black/60 ring-1 ring-amber-300/25 sm:rounded-3xl"
      >
        {/* ---------- Fondo ---------- */}
        <div aria-hidden="true" className="bf-blob-a pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-amber-400/25 blur-3xl" />
        <div aria-hidden="true" className="bf-blob-b pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-alert/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(135deg,#fff_0_1px,transparent_1px_14px)]" />
        {/* Luz que sigue al mouse */}
        <div aria-hidden="true" className="bf-spotlight pointer-events-none absolute inset-0" />

        {/* ---------- Cinta que corre ---------- */}
        <div className="relative overflow-hidden border-b border-amber-300/20 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 py-1.5 text-slate-950">
          <div className="bf-marquee flex w-max gap-6 whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.2em]">
            {[0, 1].map((copy) => (
              <span key={copy} aria-hidden={copy === 1} className="flex gap-6">
                {[...tickerText, ...tickerText].map((text, index) => (
                  <span key={`${copy}-${index}`} className="flex items-center gap-6">
                    {text}
                    <Zap size={11} className="fill-slate-950" />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar"
          className="absolute right-3 top-10 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 backdrop-blur transition hover:rotate-90 hover:bg-white/20 hover:text-white"
        >
          <X size={18} />
        </button>

        {/* ---------- Contenido (se desplaza sin barra visible si no cabe) ---------- */}
        <div className="bf-scroll relative max-h-[calc(100dvh-3rem)] overflow-y-auto overflow-x-hidden sm:max-h-[calc(100dvh-4rem)]">
          <div className="grid gap-5 p-5 pt-6 sm:p-8 md:grid-cols-[1fr_1.05fr] md:items-center md:gap-8 md:pt-14">
            {/* Columna izquierda: mensaje */}
            <div className="text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/50">
                {settings.storeName}
              </p>

              <h2
                id="bf-title"
                className="mt-2 text-[2.6rem] font-black uppercase leading-[0.9] tracking-tight sm:text-5xl"
              >
                Black
                <br className="hidden md:block" />{" "}
                <span className="bf-gold-text">Friday</span>
              </h2>

              {maxPercent > 0 ? (
                <div className="mt-4 flex items-end justify-center gap-3 md:justify-start">
                  <div>
                    <p className="text-left text-[11px] font-semibold uppercase tracking-widest text-white/60">
                      Hasta
                    </p>
                    <p className="bf-percent text-6xl font-black leading-none text-amber-300 sm:text-7xl">
                      -{maxPercent}%
                    </p>
                  </div>
                  <p className="mb-1.5 max-w-[7rem] text-left text-xs leading-4 text-white/60">
                    en {productsOnSale}{" "}
                    {productsOnSale === 1 ? "producto" : "productos"} seleccionados
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-lg font-semibold text-white/90">
                  Precios especiales en tecnología importada
                </p>
              )}

              {/* Tiempo restante */}
              <div className="mt-5" role="timer" aria-label="Tiempo restante de la oferta">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
                  Termina en
                </p>
                <div className="mt-2 flex justify-center gap-2 md:justify-start">
                  {[
                    { value: timeLeft.days, label: "días" },
                    { value: timeLeft.hours, label: "hrs" },
                    { value: timeLeft.minutes, label: "min" },
                    { value: timeLeft.seconds, label: "seg" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex w-14 flex-col items-center rounded-xl bg-white/[0.06] py-1.5 ring-1 ring-white/10"
                    >
                      <span
                        key={item.value}
                        className="bf-digit text-xl font-extrabold tabular-nums"
                      >
                        {pad(item.value)}
                      </span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-300/90">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 hidden gap-2.5 md:grid">
                <Actions whatsappUrl={whatsappUrl} onClose={() => setOpen(false)} />
              </div>
            </div>

            {/* Columna derecha: producto destacado */}
            {featured ? (
              <div
                className="bf-stage"
                onPointerEnter={() => setPaused(true)}
                onPointerLeave={() => setPaused(false)}
              >
                <Link
                  href={`/producto/${featured.product.slug}`}
                  onClick={() => setOpen(false)}
                  className="bf-tilt group relative block overflow-hidden rounded-3xl bg-white text-slate-950 shadow-2xl shadow-black/50 ring-1 ring-white/20"
                >
                  {/* Celular: foto a la izquierda y datos a la derecha. Computadora: foto grande arriba */}
                  <div key={featured.product.id} className="bf-swap flex items-center md:block">
                    <div className="bf-parallax relative w-28 shrink-0 bg-gradient-to-b from-slate-50 to-white sm:w-36 md:w-auto">
                      <ProductImage
                        src={featured.product.imageUrl}
                        alt={featured.product.name}
                        sizes="(max-width: 768px) 144px, 360px"
                        className="aspect-square w-full"
                      />
                    </div>

                    <span className="absolute left-2.5 top-2.5 rounded-lg bg-alert px-2 py-0.5 text-xs font-black text-white shadow-lg shadow-alert/30 md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-sm">
                      -{featured.percent}%
                    </span>

                    <div className="flex min-w-0 flex-1 items-end justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{featured.product.name}</p>
                        <p className="mt-0.5 flex items-baseline gap-2">
                          <span className="text-lg font-extrabold text-brand">
                            S/ {featured.salePrice}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            S/ {featured.price}
                          </span>
                        </p>
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white transition group-hover:translate-x-0.5">
                        <ChevronRight size={18} />
                      </span>
                    </div>
                  </div>

                  {/* Brillo que cruza la tarjeta */}
                  <span aria-hidden="true" className="bf-card-shine pointer-events-none absolute inset-0" />
                </Link>

                {/* Miniaturas: tocar una la destaca */}
                {deals.length > 1 && (
                  <div className="mt-3 hidden flex-wrap justify-center gap-1.5 md:flex">
                    {deals.map((deal, index) => (
                      <button
                        key={deal.product.id}
                        type="button"
                        onClick={() => setActive(index)}
                        aria-label={`Ver ${deal.product.name}`}
                        aria-pressed={index === active}
                        className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-white transition ${
                          index === active
                            ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-[#09090c]"
                            : "opacity-50 hover:opacity-90"
                        }`}
                      >
                        <ProductImage
                          src={deal.product.imageUrl}
                          alt=""
                          sizes="56px"
                          className="h-full w-full"
                        />
                        {index === active && !paused && (
                          <span
                            key={active}
                            aria-hidden="true"
                            className="bf-progress absolute inset-x-0 bottom-0 h-0.5 origin-left bg-amber-400"
                            style={{ animationDuration: `${ROTATE_EVERY}ms` }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Celular: puntitos en lugar de miniaturas */}
                {deals.length > 1 && (
                  <div className="mt-3 flex justify-center gap-1.5 md:hidden">
                    {deals.map((deal, index) => (
                      <button
                        key={deal.product.id}
                        type="button"
                        onClick={() => setActive(index)}
                        aria-label={`Ver ${deal.product.name}`}
                        aria-pressed={index === active}
                        className={`h-1.5 rounded-full transition-all ${
                          index === active ? "w-6 bg-amber-300" : "w-1.5 bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* Botones en celular (debajo del producto) */}
            <div className="grid gap-2.5 md:hidden">
              <Actions whatsappUrl={whatsappUrl} onClose={() => setOpen(false)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Actions({
  whatsappUrl,
  onClose,
}: {
  whatsappUrl: string;
  onClose: () => void;
}) {
  return (
    <>
      <Link
        href="/catalogo?ofertas=1"
        onClick={onClose}
        className="shine group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 text-sm font-extrabold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/25 transition hover:shadow-amber-400/50 hover:brightness-105"
      >
        Ver todas las ofertas
        <ChevronRight size={17} className="transition group-hover:translate-x-1" />
      </Link>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/[0.08] text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/15"
      >
        <WhatsAppIcon size={16} />
        Consultar por WhatsApp
      </a>

      <div className="flex items-center justify-between px-1 text-[11px] text-white/40">
        <span>Válido hasta {END_LABEL} o hasta agotar stock.</span>
        <button
          type="button"
          onClick={onClose}
          className="font-medium text-white/50 underline-offset-2 transition hover:text-white/90 hover:underline"
        >
          Ahora no
        </button>
      </div>
    </>
  );
}

/**
 * Estilos y animaciones del pop-up. Van aquí (y no en globals.css) para que
 * siempre se carguen junto con el pop-up.
 */
const BF_CSS = `
@keyframes bf-backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bf-pop-in {
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes bf-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes bf-gold {
  from { background-position: 0% 50%; }
  to { background-position: 200% 50%; }
}

@keyframes bf-glow {
  0%, 100% { text-shadow: 0 0 18px rgba(251, 191, 36, 0.25); }
  50% { text-shadow: 0 0 34px rgba(251, 191, 36, 0.6); }
}

@keyframes bf-digit {
  from { opacity: 0; transform: translateY(-40%); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes bf-swap {
  from { opacity: 0; transform: translateX(18px) scale(0.98); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes bf-card-shine {
  0%, 65% { transform: translateX(-130%) skewX(-18deg); }
  100% { transform: translateX(230%) skewX(-18deg); }
}

@keyframes bf-progress {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.bf-backdrop {
  animation: bf-backdrop-in 0.25s ease-out;
}

.bf-pop {
  animation: bf-pop-in 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Posición del mouse (la actualiza el componente) */
.bf-modal {
  --mx: 70%;
  --my: 30%;
  --px: 0;
  --py: 0;
  --glow: 0;
}

/* Luz dorada que sigue al mouse */
.bf-spotlight {
  opacity: var(--glow);
  transition: opacity 0.4s ease;
  background: radial-gradient(
    380px circle at var(--mx) var(--my),
    rgba(251, 191, 36, 0.16),
    transparent 65%
  );
}

/* Las manchas de color se desplazan un poco al mover el mouse (profundidad) */
.bf-blob-a,
.bf-blob-b {
  transition: translate 0.6s ease-out;
}

.bf-blob-a {
  translate: calc(var(--px) * -40px) calc(var(--py) * -40px);
}

.bf-blob-b {
  translate: calc(var(--px) * 40px) calc(var(--py) * 40px);
}

/* Cinta de texto que corre */
.bf-marquee {
  animation: bf-marquee 18s linear infinite;
}

/* Contenido desplazable sin barra visible */
.bf-scroll {
  scrollbar-width: none;
}

.bf-scroll::-webkit-scrollbar {
  display: none;
}

.bf-gold-text {
  background-image: linear-gradient(90deg, #fde68a, #f59e0b, #fde68a, #f59e0b, #fde68a);
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: bf-gold 4s linear infinite;
}

.bf-percent {
  animation: bf-glow 2.4s ease-in-out infinite;
}

.bf-digit {
  display: inline-block;
  animation: bf-digit 0.3s ease-out;
}

/* Tarjeta del producto: se inclina hacia el mouse */
.bf-stage {
  perspective: 900px;
}

.bf-tilt {
  transform: rotateY(calc(var(--px) * 14deg)) rotateX(calc(var(--py) * -12deg));
  transition: transform 0.25s ease-out;
  transform-style: preserve-3d;
}

.bf-parallax {
  translate: calc(var(--px) * -10px) calc(var(--py) * -10px);
  transition: translate 0.25s ease-out;
}

.bf-swap {
  animation: bf-swap 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.bf-card-shine {
  width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent);
  animation: bf-card-shine 3.5s ease-in-out 1s infinite;
}

.bf-progress {
  animation: bf-progress linear forwards;
}

@media (prefers-reduced-motion: reduce) {
  .bf-backdrop,
  .bf-pop,
  .bf-gold-text,
  .bf-percent,
  .bf-digit,
  .bf-swap,
  .bf-card-shine,
  .bf-progress {
    animation: none;
  }

  .bf-tilt,
  .bf-parallax,
  .bf-blob-a,
  .bf-blob-b {
    transform: none;
    translate: none;
  }
}
`;
