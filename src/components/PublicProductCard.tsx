"use client";

import ProductImage from "@/components/ProductImage";
import {
  getColorHex,
  getProductColors,
  getStartingPrice,
  getStoragePricing,
  getProductStorages,
} from "@/lib/product-options";
import type { PublicProduct } from "@/lib/supabase-products";
import { getWhatsappUrl } from "@/lib/store-settings";
import { useStoreSettings } from "@/lib/use-store-settings";
import {  } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { motion } from "motion/react";
import Link from "next/link";

const MAX_SWATCHES = 5;

function getAvailableStock(product: PublicProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

export default function PublicProductCard({
  product,
  index = 0,
}: {
  product: PublicProduct;
  /** Posición en la lista: sirve para que las tarjetas entren una tras otra */
  index?: number;
}) {
  const settings = useStoreSettings();

  const availableStock = getAvailableStock(product);
  const colors = getProductColors(product);
  const hasStorages = getProductStorages(product).length > 0;

  // Con capacidades se muestra el precio "Desde"; sin ellas, el precio normal
  const starting = getStartingPrice(product);
  const pricing = getStoragePricing(product, 0);
  const showOffer = !hasStorages && pricing.salePrice !== null;

  const discount = showOffer
    ? Math.round(((pricing.price - (pricing.salePrice ?? 0)) / pricing.price) * 100)
    : null;

  const whatsappUrl = getWhatsappUrl(
    settings.whatsappMain,
    `Hola RCA IMPORT, quiero consultar por: ${product.name} (S/ ${starting.final}). ¿Está disponible?`
  );

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{
        duration: 0.5,
        delay: (index % 4) * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white p-2.5 text-slate-950 shadow-sm transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-slate-200 sm:p-3">
      <Link
        href={`/producto/${product.slug}`}
        className="relative block overflow-hidden rounded-xl"
      >
        <span className="absolute left-2 top-2 z-10 rounded-md bg-alert px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:left-2.5 sm:top-2.5">
          {product.tag || "Nuevo"}
        </span>

        <span className="absolute right-2.5 top-2.5 z-10 hidden rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-950 shadow-sm ring-1 ring-line sm:inline-block">
          {product.countryFlag} {product.country}
        </span>

        <div className="transition duration-500 group-hover:scale-105">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 50vw, 33vw"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-0.5 pb-0.5 pt-3 sm:px-1">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-brand sm:text-[11px]">
          {product.category}
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="text-slate-500">{product.brand}</span>
        </p>

        <Link href={`/producto/${product.slug}`}>
          <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-slate-950 transition hover:text-brand sm:mt-2">
            {product.name}
          </h3>
        </Link>

        {colors.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            {colors.slice(0, MAX_SWATCHES).map((color) => (
              <span
                key={color.name}
                title={color.name}
                className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-inner sm:h-4 sm:w-4"
                style={{ backgroundColor: getColorHex(color) }}
              />
            ))}

            {colors.length > MAX_SWATCHES && (
              <span className="text-[10px] font-semibold text-slate-500">
                +{colors.length - MAX_SWATCHES}
              </span>
            )}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:mt-3">
          {starting.hasRange && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Desde
            </span>
          )}

          <p className="text-lg font-bold sm:text-xl">S/ {starting.final}</p>

          {showOffer && (
            <p className="text-xs font-medium text-slate-400 line-through sm:text-sm">
              S/ {pricing.price}
            </p>
          )}

          {discount && discount > 0 && (
            <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-alert sm:px-2 sm:text-[11px]">
              -{discount}%
            </span>
          )}
        </div>

        <div className="mt-2 hidden flex-wrap gap-1.5 sm:flex">
          {product.available && availableStock > 0 ? (
            <span className="rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
              Disponible
            </span>
          ) : (
            <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-alert">
              No disponible
            </span>
          )}

        </div>

        <div className="mt-auto flex gap-2 pt-3">
          <Link
            href={`/producto/${product.slug}`}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-brand px-3 text-xs font-semibold text-white transition hover:bg-brand-hover sm:text-[13px]"
          >
            Ver producto
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`Consultar por ${product.name} en WhatsApp`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500 text-white transition hover:bg-green-600"
          >
            <WhatsAppIcon size={17} />
          </a>
        </div>
      </div>
    </article>
    </motion.div>
  );
}
