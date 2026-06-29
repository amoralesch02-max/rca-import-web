"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import type { PublicProduct } from "@/lib/supabase-products";

type ProductPurchaseActionsProps = {
  product: PublicProduct;
};

type CartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  variant: string;
  quantity: number;
};

const CART_KEY = "rca_import_cart";

function getAvailableStock(product: PublicProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

export default function ProductPurchaseActions({
  product,
}: ProductPurchaseActionsProps) {
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const productVariants =
    product.variants && product.variants.length > 0
      ? product.variants
      : ["Única presentación"];

  const [selectedVariant, setSelectedVariant] = useState(productVariants[0]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const finalPrice = product.salePrice ?? product.price;
  const availableStock = getAvailableStock(product);
  const canBuy =
    product.available !== false &&
    product.visible !== false &&
    availableStock > 0;

  useEffect(() => {
    async function loadSettings() {
      const supabaseSettings = await getSupabaseStoreSettings();
      setSettings(supabaseSettings);
    }

    loadSettings();
  }, []);

  useEffect(() => {
    setSelectedVariant(productVariants[0]);
    setQuantity(1);
  }, [product.slug]);

  const whatsappUrl = useMemo(() => {
    return getWhatsappUrl(
      settings.whatsappMain,
      `Hola RCA IMPORT, estoy interesado en el producto ${product.name}. Variante: ${selectedVariant}. Cantidad: ${quantity}. Quiero consultar disponibilidad, separación y envío.`
    );
  }, [settings.whatsappMain, product.name, selectedVariant, quantity]);

  function addToCart() {
    if (!canBuy) {
      return;
    }

    const currentCart = localStorage.getItem(CART_KEY);
    const cart: CartItem[] = currentCart ? JSON.parse(currentCart) : [];

    const existingItem = cart.find(
      (item) =>
        item.productId === product.id && item.variant === selectedVariant
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: finalPrice,
        variant: selectedVariant,
        quantity,
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("rca-cart-updated"));

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2500);
  }

  function decreaseQuantity() {
    setQuantity((value) => Math.max(1, value - 1));
  }

  function increaseQuantity() {
    setQuantity((value) => {
      if (availableStock <= 0) {
        return value;
      }

      return Math.min(availableStock, value + 1);
    });
  }

  return (
    <div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">
            Variante
          </p>

          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">
            {availableStock} disponible(s)
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {productVariants.map((variant) => (
            <button
              key={variant}
              type="button"
              onClick={() => setSelectedVariant(variant)}
              className={`rounded-full border px-4 py-3 text-sm font-black transition ${
                selectedVariant === variant
                  ? "border-[#0057A8] bg-[#0057A8] text-white shadow-lg shadow-blue-950/30"
                  : "border-white/10 bg-white/10 text-slate-200 hover:border-blue-300 hover:bg-white hover:text-slate-950"
              }`}
            >
              {variant}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/10 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">
              Cantidad
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              Selecciona cuántas unidades deseas agregar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-sm transition hover:bg-white hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus size={18} />
            </button>

            <span className="flex h-12 min-w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 px-5 text-xl font-black text-white">
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseQuantity}
              disabled={!canBuy || quantity >= availableStock}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0057A8] text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {added && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-green-400/20 bg-green-400/10 px-5 py-4 text-sm font-black text-green-200">
          <BadgeCheck className="shrink-0" size={20} />
          Producto agregado al carrito correctamente.
        </div>
      )}

      {!canBuy && (
        <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm font-black text-amber-200">
          Este producto no tiene stock disponible por ahora. Puedes consultar por
          WhatsApp.
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={addToCart}
          disabled={!canBuy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 py-4 text-center text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart size={18} />
          Comprar
        </button>

        <Link
          href="/separar"
          onClick={(event) => {
            if (!canBuy) {
              event.preventDefault();
              return;
            }

            addToCart();
          }}
          className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-center text-sm font-black text-white shadow-lg transition ${
            canBuy
              ? "bg-[#E31B23] shadow-red-950/20 hover:bg-red-700"
              : "pointer-events-none bg-slate-700 opacity-50"
          }`}
        >
          <Wallet size={18} />
          Separar
        </Link>

        <a
          href={whatsappUrl}
          target="_blank"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-center text-sm font-black text-slate-950 transition hover:bg-slate-100"
        >
          <MessageCircle size={18} />
          WhatsApp
        </a>
      </div>

      <Link
        href="/carrito"
        className="mt-4 inline-flex w-full justify-center rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-black text-white transition hover:bg-white hover:text-slate-950"
      >
        Ver carrito
      </Link>
    </div>
  );
}