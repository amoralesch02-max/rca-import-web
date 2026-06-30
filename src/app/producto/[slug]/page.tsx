"use client";

import ProductMediaGallery from "@/components/ProductMediaGallery";
import ProductPurchaseActions from "@/components/ProductPurchaseActions";
import PublicProductCard from "@/components/PublicProductCard";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  getSupabaseProductBySlug,
  getSupabaseProducts,
  type PublicProduct,
} from "@/lib/supabase-products";
import {
  ArrowLeft,
  BadgeCheck,
  Box,
  ChevronRight,
  Clock3,
  FileCheck,
  Globe2,
  HeartHandshake,
  Layers,
  PackageCheck,
  RefreshCw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Truck,
  Wallet,
  XCircle,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getAvailableStock(product: PublicProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

function getFinalPrice(product: PublicProduct) {
  return product.salePrice ?? product.price;
}

function getDiscountPercentage(product: PublicProduct) {
  if (!product.salePrice || product.price <= 0) {
    return null;
  }

  return Math.round(((product.price - product.salePrice) / product.price) * 100);
}

function getAvailabilityData(product: PublicProduct) {
  const availableStock = getAvailableStock(product);

  if (product.available === false || product.visible === false) {
    return {
      label: "No disponible",
      description: "Consulta por WhatsApp para más información.",
      className: "bg-red-50 text-[#E31B23]",
      icon: XCircle,
    };
  }

  if (availableStock <= 0) {
    return {
      label: "Sin stock",
      description: "Este producto puede volver pronto al catálogo.",
      className: "bg-amber-50 text-amber-700",
      icon: Clock3,
    };
  }

  return {
    label: "Disponible",
    description: `${availableStock} unidad(es) listas para separar o comprar.`,
    className: "bg-green-50 text-green-700",
    icon: BadgeCheck,
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);

      const [supabaseProduct, allProducts] = await Promise.all([
        getSupabaseProductBySlug(slug),
        getSupabaseProducts(),
      ]);

      setProduct(supabaseProduct);

      if (supabaseProduct) {
        const related = allProducts
          .filter(
            (currentProduct) =>
              currentProduct.slug !== supabaseProduct.slug &&
              (currentProduct.category === supabaseProduct.category ||
                currentProduct.brand === supabaseProduct.brand)
          )
          .slice(0, 3);

        setRelatedProducts(related);
      }

      setLoading(false);
    }

    if (slug) {
      loadProduct();
    }
  }, [slug]);

  async function handleShareProduct() {
    if (!product || typeof window === "undefined") {
      return;
    }

    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Mira este producto en RCA IMPORT: ${product.name}`,
          url,
        });

        return;
      }

      await navigator.clipboard.writeText(url);
      setShareCopied(true);

      setTimeout(() => {
        setShareCopied(false);
      }, 1800);
    } catch {
      setShareCopied(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
        <SiteHeader />

        <section className="mx-auto max-w-7xl px-5 py-10 md:px-6">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <RefreshCw
              className="mx-auto mb-4 animate-spin text-[#0057A8]"
              size={44}
            />

            <p className="text-xl font-black">
              Cargando producto desde Supabase...
            </p>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Estamos preparando la información del producto.
            </p>
          </div>
        </section>

        <SiteFooter />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
        <SiteHeader />

        <section className="mx-auto max-w-7xl px-5 py-10 md:px-6">
          <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-950 p-10 text-center text-white">
              <XCircle className="mx-auto mb-4 text-red-300" size={58} />

              <p className="text-3xl font-black">Producto no encontrado</p>

              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-300">
                El producto no existe, fue eliminado o no está visible en el
                catálogo público.
              </p>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <Link
                href="/catalogo"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-6 text-sm font-black text-white transition hover:bg-blue-700"
              >
                <ShoppingBag size={18} />
                Volver al catálogo
              </Link>

              <Link
                href="/contacto"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-6 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                Contactar tienda
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </main>
    );
  }

  const availableStock = getAvailableStock(product);
  const finalPrice = getFinalPrice(product);
  const discountPercentage = getDiscountPercentage(product);
  const availability = getAvailabilityData(product);
  const AvailabilityIcon = availability.icon;

  const brandSlug = generateSlug(product.brand);
  const countrySlug = generateSlug(product.country);
  const categorySlug = generateSlug(product.category);

  const productHighlights: {
    title: string;
    value: string;
    icon: LucideIcon;
    className: string;
  }[] = [
    {
      title: "Disponibilidad",
      value: availability.label,
      icon: AvailabilityIcon,
      className: availability.className,
    },
    {
      title: "Stock",
      value: `${availableStock} unidad(es)`,
      icon: PackageCheck,
      className: "bg-blue-50 text-[#0057A8]",
    },
    {
      title: "Modalidad",
      value: product.allowsReservation ? "Compra o separación" : "Solo compra",
      icon: Wallet,
      className: "bg-purple-50 text-purple-700",
    },
    {
      title: "Origen",
      value: `${product.countryFlag} ${product.country}`,
      icon: Globe2,
      className: "bg-slate-100 text-slate-700",
    },
  ];

  const trustItems = [
    {
      icon: PackageCheck,
      text: "Producto registrado en catálogo con stock actualizado.",
    },
    {
      icon: ShieldCheck,
      text: "Coordinación directa por WhatsApp antes de concretar la compra.",
    },
    {
      icon: Truck,
      text: "Envíos disponibles a todo el Perú previa coordinación.",
    },
    {
      icon: FileCheck,
      text: product.invoice
        ? "Producto disponible con comprobante."
        : "Consultar comprobante disponible.",
    },
    {
      icon: Box,
      text: product.wholesale
        ? "Disponible también para compras por cantidad."
        : "Producto disponible para venta individual.",
    },
  ];

  const productFeatures = product.features ?? [];
  const productVariants = product.variants ?? [];

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition hover:text-[#0057A8]"
          >
            Inicio
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <Link href="/catalogo" className="transition hover:text-[#0057A8]">
            Catálogo
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <Link
            href={`/categoria/${categorySlug}`}
            className="transition hover:text-[#0057A8]"
          >
            {product.category}
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <span className="line-clamp-1 text-slate-950">{product.name}</span>
        </div>

        <section className="relative mb-8 overflow-hidden rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300 md:p-10">
          <div className="absolute right-[-160px] top-[-180px] h-96 w-96 rounded-full bg-[#0057A8]/30 blur-3xl" />
          <div className="absolute bottom-[-200px] left-[-120px] h-96 w-96 rounded-full bg-[#E31B23]/25 blur-3xl" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_0.36fr] lg:items-center">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-[#E31B23] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white">
                  <Sparkles size={15} />
                  {product.tag || "Producto RCA"}
                </span>

                {discountPercentage && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-950">
                    <Tag size={15} />
                    -{discountPercentage}% descuento
                  </span>
                )}

                {product.featured && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-slate-950">
                    <Star size={15} />
                    Destacado
                  </span>
                )}
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                {product.name}
              </h1>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold">
                <Link
                  href={`/categoria/${categorySlug}`}
                  className="rounded-full bg-white/10 px-4 py-2 text-slate-200 transition hover:bg-white hover:text-slate-950"
                >
                  {product.category}
                </Link>

                <Link
                  href={`/marca/${brandSlug}`}
                  className="rounded-full bg-white/10 px-4 py-2 text-blue-200 transition hover:bg-[#0057A8] hover:text-white"
                >
                  {product.brand}
                </Link>

                <Link
                  href={`/pais/${countrySlug}`}
                  className="rounded-full bg-white/10 px-4 py-2 text-slate-200 transition hover:bg-white hover:text-slate-950"
                >
                  {product.countryFlag} {product.country}
                </Link>

                <span className="rounded-full bg-white/10 px-4 py-2 text-slate-200">
                  {product.condition}
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">
                Precio actual
              </p>

              <div className="mt-3 flex flex-wrap items-end gap-3">
                <p className="text-5xl font-black">S/ {finalPrice}</p>

                {product.salePrice && (
                  <p className="pb-1 text-xl font-bold text-slate-400 line-through">
                    S/ {product.price}
                  </p>
                )}
              </div>

              <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
                {availability.description}
              </p>

              <button
                type="button"
                onClick={handleShareProduct}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
              >
                <Share2 size={18} />
                {shareCopied ? "Enlace copiado" : "Compartir producto"}
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <ProductMediaGallery product={product} />

          <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-3 sm:grid-cols-2">
              {productHighlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.className}`}
                    >
                      <item.icon size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                        {item.title}
                      </p>

                      <p className="mt-1 truncate text-sm font-black text-slate-950">
                        {item.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-[2rem] bg-slate-950 p-6 text-white">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-300">
                Compra rápida
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight">
                Separa o consulta este producto con RCA IMPORT.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
                Puedes agregarlo al carrito, separar con adelanto o consultar
                directamente por WhatsApp según disponibilidad.
              </p>

              <div className="mt-6">
                <ProductPurchaseActions product={product} />
              </div>
            </div>

            <div className="mt-7">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#E31B23]">
                Descripción
              </p>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                {product.description ||
                  "Este producto aún no tiene una descripción detallada registrada."}
              </p>
            </div>

            {productVariants.length > 0 && (
              <div className="mt-7">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.22em] text-[#0057A8]">
                  <Layers size={17} />
                  Colores disponibles
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {productVariants.map((variant) => (
                    <span
                      key={variant}
                      className="rounded-full border border-slate-200 bg-[#f6f8fc] px-4 py-2 text-xs font-black text-slate-700"
                    >
                      {variant}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                  Características
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Información del producto
                </h2>
              </div>

              <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8] sm:flex">
                <Zap size={26} />
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {productFeatures.length > 0 ? (
                productFeatures.map((feature) => (
                  <div
                    key={feature}
                    className="flex gap-3 rounded-2xl bg-[#f6f8fc] p-4"
                  >
                    <BadgeCheck className="shrink-0 text-[#0057A8]" />

                    <p className="text-sm font-semibold leading-6 text-slate-600">
                      {feature}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl bg-[#f6f8fc] p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Este producto aún no tiene características registradas.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="rounded-[2.5rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200 md:p-8">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
              Compra segura
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight">
              Atención personalizada por RCA IMPORT.
            </h2>

            <div className="mt-6 space-y-4">
              {trustItems.map((item) => (
                <div key={item.text} className="flex gap-3">
                  <item.icon className="shrink-0 text-blue-300" />

                  <p className="text-sm font-semibold leading-6 text-slate-300">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-[1.7rem] border border-white/10 bg-white/10 p-5">
              <div className="flex gap-3">
                <HeartHandshake className="shrink-0 text-blue-300" />

                <p className="text-sm font-semibold leading-6 text-slate-300">
                  Si deseas confirmar compatibilidad, condición del producto o
                  precio por cantidad, comunícate con RCA IMPORT antes de
                  separar.
                </p>
              </div>
            </div>
          </aside>
        </section>

        {relatedProducts.length > 0 && (
          <section className="mt-10">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                  También podría interesarte
                </p>

                <h2 className="mt-3 text-4xl font-black">
                  Productos relacionados
                </h2>
              </div>

              <Link
                href="/catalogo"
                className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-[#0057A8] hover:text-white"
              >
                Ver catálogo
                <ChevronRight size={17} />
              </Link>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {relatedProducts.map((relatedProduct) => (
                <PublicProductCard
                  key={relatedProduct.slug}
                  product={relatedProduct}
                />
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-[#0057A8]"
          >
            <ArrowLeft size={18} />
            Volver al catálogo
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}