"use client";

import HeroCarousel, {
  type HeroCarouselItem,
} from "@/components/HeroCarousel";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import PublicProductCard from "@/components/PublicProductCard";
import Reveal from "@/components/Reveal";
import ScrollToTop from "@/components/ScrollToTop";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { categoryItems } from "@/data/products";
import { getCategoryIcon } from "@/lib/category-icons";
import { getStartingPrice } from "@/lib/product-options";
import { getSupabaseBanners, type PublicBanner } from "@/lib/supabase-banners";
import {
  getSupabaseProducts,
  type PublicProduct,
} from "@/lib/supabase-products";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  getSupabaseCategories,
  type PublicCategory,
} from "@/lib/supabase-taxonomies";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import {
  Headphones,
  PackageCheck,
  Plus,
  Truck,
  Wallet,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const container = "mx-auto max-w-7xl px-5 md:px-6";

/**
 * Textos del encabezado del inicio. Cámbialos aquí cuando quieras.
 * El título se arma así:  [antes] [resaltado subrayado en rojo] [después]
 */
const HERO = {
  badge: "✦ Productos estrella",
  before: "Renueva tu",
  highlight: "iPhone",
  after: "al mejor precio",
  tagline: "Desliza y descubre los equipos del momento",
};

/**
 * Interruptor: pon `true` para volver a mostrar la sección Mayorista
 * en el inicio (y el botón "Compra mayorista").
 */
const SHOW_WHOLESALE = false;

export default function HomePage() {
  const [banners, setBanners] = useState<PublicBanner[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);

      const [
        supabaseBanners,
        supabaseProducts,
        supabaseSettings,
        supabaseCategories,
      ] = await Promise.all([
        getSupabaseBanners(),
        getSupabaseProducts(),
        getSupabaseStoreSettings(),
        getSupabaseCategories(),
      ]);

      setBanners(supabaseBanners);
      setProducts(supabaseProducts);
      setSettings(supabaseSettings);
      setCategories(supabaseCategories);
      setLoading(false);
    }

    loadHomeData();
  }, []);

  const featuredProducts = useMemo(() => {
    const featured = products.filter((product) => product.featured);

    if (featured.length > 0) {
      return featured.slice(0, 8);
    }

    return products.slice(0, 8);
  }, [products]);

  const wholesaleProducts = useMemo(() => {
    return products.filter((product) => product.wholesale).slice(0, 3);
  }, [products]);

  // Categorías del inicio: las de Supabase que tienen productos
  // (si aún no cargan, se usa la lista base)
  const homeCategories = useMemo(() => {
    const source: { name: string; slug: string }[] =
      categories.length > 0 ? categories : categoryItems;

    const withProducts = source.filter((category) =>
      products.some(
        (product) =>
          product.category.toLowerCase() === category.name.toLowerCase()
      )
    );

    return (withProducts.length > 0 ? withProducts : source).slice(0, 6);
  }, [categories, products]);

  // Carrusel: usa los banners con imagen; si faltan, completa con productos destacados
  const carouselItems = useMemo<HeroCarouselItem[]>(() => {
    const fromBanners: HeroCarouselItem[] = banners
      .filter((banner) => banner.imageUrl)
      .map((banner, i) => ({
        id: `banner-${i}`,
        image: banner.imageUrl,
        title: banner.title,
        subtitle: banner.label || "",
        href: banner.buttonUrl || "/catalogo",
        fit: "cover",
      }));

    const fromProducts: HeroCarouselItem[] = featuredProducts
      .filter((product) => product.imageUrl)
      .map((product) => {
        const starting = getStartingPrice(product);

        return {
          id: `product-${product.slug}`,
          image: product.imageUrl ?? "",
          title: product.name,
          subtitle: `${starting.hasRange ? "Desde " : ""}S/ ${starting.final}`,
          href: `/producto/${product.slug}`,
          fit: "contain",
        };
      });

    return [...fromBanners, ...fromProducts].slice(0, 8);
  }, [banners, featuredProducts]);

  const lowestPrice = useMemo(() => {
    const prices = products
      .map((product) => getStartingPrice(product).final)
      .filter((price) => price > 0);

    return prices.length > 0 ? Math.min(...prices) : null;
  }, [products]);

  const whatsappUrl = useMemo(() => {
    return getWhatsappUrl(
      settings.whatsappMain,
      "Hola RCA IMPORT, vengo de la web. Quisiera una recomendación según mi presupuesto."
    );
  }, [settings.whatsappMain]);

  const faqs = [
    {
      q: "¿Cómo compro un producto?",
      a: "Elige el producto, agrégalo al carrito y pulsa “Consultar por WhatsApp”. Te atendemos con tu pedido ya listo para coordinar el pago y el envío.",
    },
    {
      q: "¿Hacen envíos a todo el Perú?",
      a: settings.shippingMessage,
    },
    {
      q: "¿Qué formas de pago aceptan?",
      a: settings.paymentMessage,
    },
  ];

  return (
    <main className="min-h-screen bg-bg text-slate-950">
      <ScrollToTop />
      <SiteHeader />

      {/* ================= HERO ================= */}
      <section className="hero-bg hero-grid border-b border-slate-800 text-white">
        <div
          aria-hidden="true"
          className="animate-drift pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-sky-400/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="animate-drift-slow pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-alert/25 blur-3xl"
        />

        <div className={`${container} relative z-10 py-6 md:py-10`}>
          <Reveal y={16} className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3.5 py-1 text-[11px] font-semibold tracking-wide text-blue-100 backdrop-blur">
              {HERO.badge}
            </span>

            <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight md:text-4xl">
              {HERO.before}{" "}
              <span className="underline decoration-alert decoration-[3px] underline-offset-[6px]">
                {HERO.highlight}
              </span>{" "}
              {HERO.after}
            </h1>

            <p className="mt-2 text-sm text-blue-100/90">{HERO.tagline}</p>
          </Reveal>

          {/* Productos estrella: son los protagonistas */}
          <Reveal
            scale={0.94}
            delay={0.15}
            className="relative mx-auto mt-4 max-w-3xl md:mt-6"
          >
            {lowestPrice !== null && (
              <div className="absolute left-0 top-0 z-[250] rounded-xl bg-white px-3.5 py-2 text-slate-950 shadow-lg sm:px-4 sm:py-2.5">
                <p className="text-sm font-bold">Desde S/ {lowestPrice}</p>
                <p className="hidden text-[11px] text-slate-500 sm:block">
                  Envíos a todo el Perú
                </p>
              </div>
            )}

            <HeroCarousel items={carouselItems} />
          </Reveal>
        </div>
      </section>

      {/* ================= BENEFICIOS ================= */}
      <section className="border-b border-line bg-white">
        <div
          className={`${container} flex gap-6 overflow-x-auto py-4 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:py-6`}
        >
          {[
            {
              icon: PackageCheck,
              title: "Stock real",
              text: "Inventario actualizado",
            },
            {
              icon: Truck,
              title: "Envíos a todo el Perú",
              text: "Coordinación por WhatsApp",
            },
            {
              icon: Wallet,
              title: "Pago seguro",
              text: "Yape y transferencia",
            },
            {
              icon: Headphones,
              title: "Atención directa",
              text: "Te asesoramos al momento",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex shrink-0 items-center gap-2.5 lg:gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand lg:h-10 lg:w-10">
                <item.icon size={17} />
              </div>

              <div>
                <p className="whitespace-nowrap text-xs font-semibold lg:text-sm">
                  {item.title}
                </p>
                <p className="hidden text-xs text-slate-500 lg:block">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CATEGORÍAS ================= */}
      <section className={`${container} py-10 md:py-14`}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight md:text-2xl">
            Categorías
          </h2>

          <Link
            href="/catalogo"
            className="shrink-0 text-sm font-semibold text-brand transition hover:text-brand-hover"
          >
            Ver todo →
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5 sm:gap-3 lg:grid-cols-6">
          {homeCategories.map((category, index) => {
            const Icon = getCategoryIcon(category.name, category.slug);

            return (
              <Reveal
                key={category.slug}
                delay={index * 0.05}
                y={18}
                className="h-full"
              >
              <Link
                href={`/categoria/${category.slug}`}
                className="group flex h-full flex-col items-center gap-2.5 rounded-2xl border border-line bg-white px-2 py-4 text-center transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-slate-200 sm:gap-3 sm:py-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-brand transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-brand group-hover:text-white sm:h-12 sm:w-12">
                  <Icon size={22} strokeWidth={1.8} />
                </div>

                <p className="line-clamp-1 text-xs font-semibold sm:text-sm">
                  {category.name}
                </p>
              </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ================= DESTACADOS ================= */}
      <section className="border-t border-line pb-10 pt-10 md:pb-14 md:pt-14">
        <div className={container}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold tracking-tight md:text-2xl">
              Destacados
            </h2>

            <Link
              href="/catalogo"
              className="shrink-0 text-sm font-semibold text-brand transition hover:text-brand-hover"
            >
              Ver tienda →
            </Link>
          </div>

          {loading ? (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {featuredProducts.map((product, index) => (
                <PublicProductCard
                  key={product.slug}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-line bg-white p-10 text-center">
              <p className="text-base font-semibold">
                Aún no hay productos visibles.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Agrega productos desde el panel administrador.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ================= MAYORISTA (oculto: ver SHOW_WHOLESALE) ================= */}
      {SHOW_WHOLESALE && (
        <section className={`${container} pb-14`}>
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1fr]">
            <div className="rounded-3xl bg-slate-950 p-8 text-white">
              <h2 className="text-2xl font-bold">Compras por mayor</h2>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                {settings.wholesaleMessage}
              </p>

              <Link
                href="/catalogo?tipo=mayorista"
                className="mt-7 inline-flex rounded-full bg-alert px-6 py-3 text-sm font-semibold text-white transition hover:bg-alert-hover"
              >
                Ver productos mayoristas
              </Link>
            </div>

            <div className="grid content-start gap-3">
              {wholesaleProducts.map((product) => (
                <Link
                  key={product.slug}
                  href={`/producto/${product.slug}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-brand/40"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {product.brand} · {product.countryFlag} {product.country}
                    </p>
                  </div>

                  <p className="shrink-0 text-xl font-bold">
                    S/ {getStartingPrice(product).final}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CTA WHATSAPP ================= */}
      <section className={`${container} pb-10 md:pb-14`}>
        <Reveal>
        <div className="cta-gradient flex flex-col items-start justify-between gap-5 rounded-3xl p-7 text-white md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="text-xl font-bold md:text-3xl">
              ¿No sabes cuál elegir?
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">
              Escríbenos y te asesoramos según tu presupuesto.
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
        </Reveal>
      </section>

      {/* ================= PREGUNTAS FRECUENTES ================= */}
      <section className="border-t border-line py-10 md:py-14">
        <div className="mx-auto max-w-3xl px-5 md:px-6">
          <h2 className="text-center text-xl font-bold tracking-tight md:text-2xl">
            Preguntas frecuentes
          </h2>

          <div className="mt-6 grid gap-3">
            {faqs.map((item, index) => (
              <Reveal key={item.q} delay={index * 0.07} y={16}>
              <details
                className="group rounded-xl border border-line bg-white px-5 py-4 open:border-brand/50"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold">
                  {item.q}
                  <Plus
                    size={18}
                    className="shrink-0 text-slate-400 transition group-open:rotate-45"
                  />
                </summary>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {item.a}
                </p>
              </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
