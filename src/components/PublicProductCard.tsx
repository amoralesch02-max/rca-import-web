"use client";

import type { PublicProduct } from "@/lib/supabase-products";
import { Package, ShoppingCart } from "lucide-react";
import Link from "next/link";

function getAvailableStock(product: PublicProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

function getFinalPrice(product: PublicProduct) {
  return product.salePrice ?? product.price;
}

export default function PublicProductCard({
  product,
}: {
  product: PublicProduct;
}) {
  const availableStock = getAvailableStock(product);
  const finalPrice = getFinalPrice(product);

  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl">
      <Link
        href={`/producto/${product.slug}`}
        className="relative block overflow-hidden rounded-[1.5rem] bg-[#edf4fb]"
      >
        <div className="absolute left-4 top-4 z-10 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950 shadow-sm">
          {product.countryFlag} {product.country}
        </div>

        <div className="absolute right-4 top-4 z-10 rounded-full bg-[#E31B23] px-4 py-2 text-xs font-black text-white shadow-sm">
          {product.tag || "Nuevo"}
        </div>

        <div className="flex h-64 items-center justify-center p-6">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-contain transition duration-300 hover:scale-105"
            />
          ) : (
            <Package className="text-slate-700" size={74} />
          )}
        </div>
      </Link>

      <div className="px-2 py-5">
        <p className="text-sm font-black text-slate-500">
          {product.category}
          <span className="mx-2 text-slate-300">·</span>
          <span className="text-[#0057A8]">{product.brand}</span>
        </p>

        <Link href={`/producto/${product.slug}`}>
          <h3 className="mt-3 line-clamp-2 text-2xl font-black leading-tight text-slate-950 hover:text-[#0057A8]">
            {product.name}
          </h3>
        </Link>

        <div className="mt-4 flex items-end gap-3">
          <p className="text-3xl font-black text-slate-950">S/ {finalPrice}</p>

          {product.salePrice && (
            <p className="pb-1 text-lg font-black text-slate-400 line-through">
              S/ {product.price}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-[#0057A8]">
            Stock: {availableStock}
          </span>

          {product.featured && (
            <span className="rounded-full bg-amber-50 px-4 py-2 text-xs font-black text-amber-700">
              Destacado
            </span>
          )}

          {!product.available && (
            <span className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-[#E31B23]">
              No disponible
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Link
            href={`/producto/${product.slug}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-4 text-sm font-black text-white transition hover:bg-blue-700"
          >
            <ShoppingCart size={16} />
            Comprar
          </Link>

          <Link
            href={`/separar?producto=${product.slug}`}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#E31B23] px-4 text-sm font-black text-white transition hover:bg-red-700"
          >
            Separar
          </Link>

          <Link
            href={`/producto/${product.slug}`}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#f1f5f9] px-4 text-sm font-black text-slate-700 transition hover:bg-slate-200"
          >
            Detalle
          </Link>
        </div>
      </div>
    </article>
  );
}