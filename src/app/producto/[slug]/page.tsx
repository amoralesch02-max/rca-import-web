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
  getProductColors,
  getProductStorages,
  getStoragePricing,
} from "@/lib/product-options";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import {
  BadgeCheck,
  Box,
  ChevronRight,
  Clock3,
  PackageCheck,
  RefreshCw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Truck,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

function getAvailabilityData(product: PublicProduct): {
  label: string;
  description: string;
  className: string;
  icon: LucideIcon;
} {
  const availableStock = getAvailableStock(product);

  if (product.available === false || product.visible === false) {
    return {
      label: "No disponible",
      description: "Consulta por WhatsApp para más información.",
      className: "bg-red-50 text-alert",
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
    description: "",
    className: "bg-green-50 text-green-700",
    icon: BadgeCheck,
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = String(params.slug);

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<PublicProduct[]>([]);
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedStorage, setSelectedStorage] = useState(0);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);

      const [supabaseProduct, allProducts, supabaseSettings] =
        await Promise.all([
          getSupabaseProductBySlug(slug),
          getSupabaseProducts(),
          getSupabaseStoreSettings(),
        ]);

      setProduct(supabaseProduct);
      setSettings(supabaseSettings);

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

    setSelectedColor(0);
    setSelectedStorage(0);

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
      <main className="min-h-screen bg-bg text-slate-950">
        <SiteHeader />

        <section className="mx-auto max-w-7xl px-5 py-10 md:px-6">
          <div className="rounded-2xl border border-line bg-white p-10 text-center">
            <RefreshCw
              className="mx-auto mb-4 animate-spin text-brand"
              size={38}
            />

            <p className="text-lg font-semibold">Cargando producto...</p>

            <p className="mt-1 text-sm text-slate-500">
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
      <main className="min-h-screen bg-bg text-slate-950">
        <SiteHeader />

        <section className="mx-auto max-w-3xl px-5 py-12 md:px-6">
          <div className="overflow-hidden rounded-2xl border border-line bg-white text-center">
            <div className="bg-slate-950 px-6 py-10 text-white">
              <XCircle className="mx-auto mb-4 text-red-300" size={52} />

              <p className="text-2xl font-bold">Producto no encontrado</p>

              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-300">
                El producto no existe, fue eliminado o no está visible en el
                catálogo público.
              </p>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <Link
                href="/catalogo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                <ShoppingBag size={17} />
                Volver al catálogo
              </Link>

              <Link
                href="/contacto"
                className="inline-flex h-12 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
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

  const colors = getProductColors(product);
  const storages = getProductStorages(product);
  const pricing = getStoragePricing(product, selectedStorage);
  const finalPrice = pricing.final;
  const discountPercentage = pricing.salePrice
    ? Math.round(((pricing.price - pricing.salePrice) / pricing.price) * 100)
    : null;
  const availability = getAvailabilityData(product);
  const AvailabilityIcon = availability.icon;

  const brandSlug = generateSlug(product.brand);
  const countrySlug = generateSlug(product.country);
  const categorySlug = generateSlug(product.category);

  const productFeatures = product.features ?? [];

  const whatsappQuestionUrl = getWhatsappUrl(
    settings.whatsappMain,
    `Hola RCA IMPORT, tengo una consulta sobre el producto ${product.name}.`
  );

  const trustItems: { icon: LucideIcon; text: string }[] = [
    {
      icon: PackageCheck,
      text: "Stock actualizado en catálogo.",
    },
    {
      icon: ShieldCheck,
      text: "Coordinación directa por WhatsApp antes de comprar.",
    },
    {
      icon: Truck,
      text: "Envíos a todo el Perú previa coordinación.",
    },
    {
      icon: Box,
      text: product.wholesale
        ? "Disponible también por cantidad."
        : "Disponible para venta individual.",
    },
  ];

  return (
    <main className="min-h-screen bg-bg text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-5 py-5 md:px-6 md:py-6">
        {/* Migas de pan */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-brand">
            Inicio
          </Link>

          <ChevronRight size={13} className="text-slate-300" />

          <Link href="/catalogo" className="transition hover:text-brand">
            Catálogo
          </Link>

          <ChevronRight size={13} className="text-slate-300" />

          <Link
            href={`/categoria/${categorySlug}`}
            className="transition hover:text-brand"
          >
            {product.category}
          </Link>

          <ChevronRight size={13} className="text-slate-300" />

          <span className="line-clamp-1 text-slate-700">{product.name}</span>
        </nav>

        {/* Galería + información */}
        <div className="mt-4 grid gap-6 lg:grid-cols-[0.9fr_1fr] lg:gap-10">
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <ProductMediaGallery
              key={product.slug}
              product={product}
              colors={colors}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs font-bold uppercase tracking-widest text-brand">
                {product.condition}
              </p>

              <button
                type="button"
                onClick={handleShareProduct}
                aria-label="Compartir producto"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand hover:text-brand"
              >
                <Share2 size={14} />
                {shareCopied ? "Enlace copiado" : "Compartir"}
              </button>
            </div>

            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight md:text-[1.7rem]">
              {product.name}
            </h1>

            {/* Chips: categoría, marca, país */}
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
              <Link
                href={`/categoria/${categorySlug}`}
                className="rounded-full bg-white px-3 py-1.5 text-slate-600 ring-1 ring-line transition hover:text-brand hover:ring-brand"
              >
                {product.category}
              </Link>

              <Link
                href={`/marca/${brandSlug}`}
                className="rounded-full bg-white px-3 py-1.5 text-slate-600 ring-1 ring-line transition hover:text-brand hover:ring-brand"
              >
                {product.brand}
              </Link>

              <Link
                href={`/pais/${countrySlug}`}
                className="rounded-full bg-white px-3 py-1.5 text-slate-600 ring-1 ring-line transition hover:text-brand hover:ring-brand"
              >
                {product.countryFlag} {product.country}
              </Link>
            </div>

            {/* Precio */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <motion.p
                key={finalPrice}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-3xl font-bold tracking-tight"
              >
                S/ {finalPrice}
              </motion.p>

              {pricing.salePrice && (
                <p className="text-base font-medium text-slate-400 line-through">
                  S/ {pricing.price}
                </p>
              )}

              {discountPercentage && (
                <span className="rounded-md bg-alert px-2.5 py-1 text-xs font-bold text-white">
                  -{discountPercentage}%
                </span>
              )}

              {product.tag && (
                <span className="rounded-md bg-slate-950 px-2.5 py-1 text-xs font-bold text-white">
                  {product.tag}
                </span>
              )}
            </div>

            {/* Disponibilidad */}
            <p
              className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${availability.className}`}
            >
              <AvailabilityIcon size={16} />
              {availability.label}
            </p>


            {/* Características destacadas */}
            {productFeatures.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {productFeatures.slice(0, 8).map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-slate-700"
                  >
                    <BadgeCheck
                      size={18}
                      className="mt-0.5 shrink-0 text-slate-950"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <hr className="my-5 border-line" />

            {/* Compra */}
            <ProductPurchaseActions
              key={product.slug}
              product={product}
              colors={colors}
              storages={storages}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
              selectedStorage={selectedStorage}
              onStorageChange={setSelectedStorage}
            />

            <a
              href={whatsappQuestionUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800"
            >
              <WhatsAppIcon size={16} />
              ¿Dudas? Escríbenos por WhatsApp
            </a>

            {/* Compra segura */}
            <div className="mt-5 grid gap-2.5 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2">
              {trustItems.map((item) => (
                <div
                  key={item.text}
                  className="flex items-start gap-2.5 text-xs leading-5 text-slate-600"
                >
                  <item.icon size={16} className="mt-0.5 shrink-0 text-brand" />
                  {item.text}
                </div>
              ))}
            </div>

            {/* Formas de pago */}
            <div className="mt-3 rounded-2xl border border-line bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Formas de pago
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {["Yape", "Transferencia"].map((method) => (
                  <span
                    key={method}
                    className="rounded-md border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {method}
                  </span>
                ))}
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                {settings.paymentMessage}
              </p>
            </div>
          </div>
        </div>

        {/* Más productos */}
        {relatedProducts.length > 0 && (
          <section className="mt-10 border-t border-line pt-8">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-2xl font-bold tracking-tight">
                Más {product.category}
              </h2>

              <Link
                href={`/categoria/${categorySlug}`}
                className="shrink-0 text-sm font-semibold text-brand transition hover:text-brand-hover"
              >
                Ver todo →
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {relatedProducts.map((relatedProduct, index) => (
                <PublicProductCard
                  key={relatedProduct.slug}
                  product={relatedProduct}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
