"use client";

import PublicProductCard from "@/components/PublicProductCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { categoryItems } from "@/data/products";
import { getSupabaseBanners, type PublicBanner } from "@/lib/supabase-banners";
import {
  getSupabaseProducts,
  type PublicProduct,
} from "@/lib/supabase-products";
import {
  BadgeCheck,
  Box,
  ChevronRight,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CustomerDeliveriesSection from "@/components/CustomerDeliveriesSection";

export default function HomePage() {
  const [banners, setBanners] = useState<PublicBanner[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      setLoading(true);

      const [supabaseBanners, supabaseProducts] = await Promise.all([
        getSupabaseBanners(),
        getSupabaseProducts(),
      ]);

      setBanners(supabaseBanners);
      setProducts(supabaseProducts);
      setLoading(false);
    }

    loadHomeData();
  }, []);

  const mainBanner = banners[0] ?? null;

  const featuredProducts = useMemo(() => {
    const featured = products.filter((product) => product.featured);

    if (featured.length > 0) {
      return featured.slice(0, 6);
    }

    return products.slice(0, 6);
  }, [products]);

  const wholesaleProducts = useMemo(() => {
    return products.filter((product) => product.wholesale).slice(0, 3);
  }, [products]);

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <SiteHeader />

      
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div
          className={`grid gap-6 ${
            mainBanner ? "lg:grid-cols-[1fr_0.42fr]" : "lg:grid-cols-1"
          }`}
        >
          {mainBanner && (
            <section className="relative overflow-hidden rounded-[3rem] bg-slate-950 p-8 text-white shadow-2xl shadow-slate-300 md:p-12">
              <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-[#0057A8]/30 blur-3xl" />
              <div className="absolute bottom-[-140px] left-[-120px] h-80 w-80 rounded-full bg-[#E31B23]/25 blur-3xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                  <Sparkles size={16} />
                  {mainBanner.label}
                </div>

                <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                  {mainBanner.title}
                </h1>

                <p className="mt-6 max-w-2xl text-sm font-semibold leading-7 text-slate-300 md:text-base">
                  {mainBanner.subtitle}
                </p>

                {mainBanner.imageUrl && (
                  <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-3">
                    <img
                      src={mainBanner.imageUrl}
                      alt={mainBanner.title}
                      className="h-72 w-full rounded-[1.5rem] object-cover"
                    />
                  </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={mainBanner.buttonUrl || "/catalogo"}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700"
                  >
                    {mainBanner.buttonText || "Ver catálogo"}
                    <ChevronRight size={18} />
                  </Link>

                  <Link
                    href="/contacto"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                  >
                    Contactar
                    <Headphones size={18} />
                  </Link>
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      title: "Stock real",
                      text: `${products.length} producto(s) activos`,
                      icon: PackageCheck,
                    },
                    {
                      title: "Envíos",
                      text: "A todo el Perú",
                      icon: Truck,
                    },
                    {
                      title: "Pagos",
                      text: "Yape y coordinación",
                      icon: Wallet,
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-3xl border border-white/10 bg-white/10 p-5"
                    >
                      <item.icon className="mb-4 text-blue-300" />

                      <p className="font-black">{item.title}</p>

                      <p className="mt-1 text-xs font-semibold text-slate-300">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <aside className="rounded-[3rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-blue-50 text-[#0057A8]">
                  <Smartphone size={42} />
                </div>

                <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                  RCA IMPORT
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Compra tecnología importada con atención directa.
                </h2>

                <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">
                  Encuentra productos importados, accesorios y novedades seleccionadas para ti. 
                  Trabajamos con atención personalizada, disponibilidad actualizada y opciones para compras al detalle o por mayor.
                </p>
              </div>

              <div className="mt-8 grid gap-3">
                {[
                  "Productos disponibles y actualizados.",
                  "Atención directa por WhatsApp.",
                  "Catálogo para compras al detalle y mayorista.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-2xl bg-[#f6f8fc] p-4"
                  >
                    <BadgeCheck className="shrink-0 text-[#0057A8]" />

                    <p className="text-sm font-bold text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Categorías
              </p>

              <h2 className="mt-3 text-4xl font-black">
                Explora por tipo de producto
              </h2>
            </div>

            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 text-sm font-black text-[#0057A8]"
            >
              Ver todo el catálogo
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {categoryItems.slice(0, 6).map((category) => (
              <Link
                key={category.slug}
                href={`/categoria/${category.slug}`}
                className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8] transition group-hover:bg-[#0057A8] group-hover:text-white">
                  <Box />
                </div>

                <h3 className="text-2xl font-black">{category.name}</h3>

                <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Productos destacados
              </p>
              
              <h2 className="mt-3 text-4xl font-black">
                Selección principal de RCA IMPORT
              </h2>
            </div>
            
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white"
            >
              Ver catálogo
              <ChevronRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="font-black">Cargando productos desde Supabase...</p>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {featuredProducts.map((product) => (
                <PublicProductCard key={product.slug} product={product} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-xl font-black">
                Aún no hay productos visibles.
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Agrega productos desde el panel administrador.
              </p>
            </div>
          )}
        </section>

          <CustomerDeliveriesSection />
          
        <section className="mt-12 grid gap-6 lg:grid-cols-[0.8fr_1fr]">
          <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-200">
            <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
              Mayorista
            </div>

            <h2 className="mt-6 text-4xl font-black leading-tight">
              Productos disponibles para compras por cantidad.
            </h2>

            <p className="mt-5 text-sm font-semibold leading-7 text-slate-300">
              Ideal para accesorios, cables, cubos, cases y productos
              importados. Consulta precios especiales por WhatsApp.
            </p>

            <Link
              href="/catalogo?tipo=mayorista"
              className="mt-8 inline-flex rounded-full bg-[#E31B23] px-6 py-4 text-sm font-black text-white"
            >
              Ver productos mayoristas
            </Link>
          </div>

          <div className="grid gap-4">
            {wholesaleProducts.length > 0 ? (
              wholesaleProducts.map((product) => (
                <Link
                  key={product.slug}
                  href={`/producto/${product.slug}`}
                  className="flex flex-col justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#0057A8] md:flex-row md:items-center"
                >
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#E31B23]">
                      {product.category}
                    </p>

                    <h3 className="mt-2 text-2xl font-black">
                      {product.name}
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      {product.brand} · {product.countryFlag} {product.country}
                    </p>
                  </div>

                  <div className="md:text-right">
                    <p className="text-2xl font-black text-[#0057A8]">
                      S/ {product.salePrice ?? product.price}
                    </p>

                    <p className="mt-1 text-xs font-black text-slate-400">
                      Ver detalle
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
                <p className="font-black">
                  Aún no hay productos mayoristas visibles.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="mt-12 rounded-[3rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Confianza",
                text: "Atención directa y coordinación antes de confirmar la compra.",
                icon: ShieldCheck,
              },
              {
                title: "Stock actualizado",
                text: "Productos visibles conectados a la base de datos real.",
                icon: PackageCheck,
              },
              {
                title: "Envíos",
                text: "Coordinación de envíos a todo el Perú.",
                icon: Truck,
              },
            ].map((item) => (
              <div key={item.title} className="rounded-[2rem] bg-[#f6f8fc] p-6">
                <item.icon className="mb-5 text-[#0057A8]" size={32} />

                <h3 className="text-2xl font-black">{item.title}</h3>

                <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 overflow-hidden rounded-[3rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-300 md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_0.45fr] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                <Star size={16} />
                Atención personalizada
              </div>

              <h2 className="mt-5 max-w-2xl text-4xl font-black leading-tight text-white">
                ¿Quieres separar un producto o consultar stock?
              </h2>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
                Puedes revisar el catálogo, elegir un producto y coordinar tu
                compra o separación directamente con RCA IMPORT.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/contacto"
                className="rounded-full bg-white px-6 py-4 text-center text-sm font-black text-slate-950 transition hover:bg-slate-100"
              >
                Contactar ahora
              </Link>

              <Link
                href="/catalogo"
                className="rounded-full border border-white/20 px-6 py-4 text-center text-sm font-black text-white transition hover:bg-white/10"
              >
                Ver catálogo
              </Link>
            </div>
          </div>
        </section>
      </section>

      <SiteFooter />
    </main>
  );
}