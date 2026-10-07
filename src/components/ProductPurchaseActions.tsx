"use client";

import {
  buildVariantLabel,
  getColorHex,
  getStoragePricing,
  type ColorOption,
  type StorageOption,
} from "@/lib/product-options";
import type { PublicProduct } from "@/lib/supabase-products";
import { getWhatsappUrl } from "@/lib/store-settings";
import { useStoreSettings } from "@/lib/use-store-settings";
import {
  Check,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  variant: string;
  quantity: number;
  image?: string;
};

type ProductPurchaseActionsProps = {
  product: PublicProduct;
  colors: ColorOption[];
  storages: StorageOption[];
  selectedColor: number;
  onColorChange: (index: number) => void;
  selectedStorage: number;
  onStorageChange: (index: number) => void;
};

const CART_KEY = "rca_import_cart";

function getAvailableStock(product: PublicProduct) {
  return Math.max(product.stock - product.reservedStock, 0);
}

export default function ProductPurchaseActions({
  product,
  colors,
  storages,
  selectedColor,
  onColorChange,
  selectedStorage,
  onStorageChange,
}: ProductPurchaseActionsProps) {
  const settings = useStoreSettings();

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  const color = colors[selectedColor];
  const storage = storages[selectedStorage];
  const pricing = getStoragePricing(product, selectedStorage);
  const variantLabel = buildVariantLabel(color?.name, storage?.label);

  const availableStock = getAvailableStock(product);
  const canBuy =
    product.available !== false &&
    product.visible !== false &&
    availableStock > 0;

  useEffect(() => {
    setQuantity(1);
  }, [product.slug]);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  // Mensaje automático para WhatsApp con la opción elegida
  const whatsappUrl = useMemo(() => {
    const lines = [
      `Hola RCA IMPORT, quiero consultar por este producto:`,
      ``,
      `• ${product.name}`,
      color ? `• Color: ${color.name}` : "",
      storage ? `• Capacidad: ${storage.label}` : "",
      `• Cantidad: ${quantity}`,
      `• Precio: S/ ${pricing.final}`,
      pageUrl ? `\n${pageUrl}` : "",
      ``,
      `¿Está disponible? Quisiera coordinar compra y envío.`,
    ].filter((line, index, all) => line !== "" || all[index - 1] !== "");

    return getWhatsappUrl(settings.whatsappMain, lines.join("\n"));
  }, [
    settings.whatsappMain,
    product.name,
    color,
    storage,
    quantity,
    pricing.final,
    pageUrl,
  ]);

  function addToCart() {
    if (!canBuy) {
      return;
    }

    const currentCart = localStorage.getItem(CART_KEY);
    let cart: CartItem[] = [];

    try {
      cart = currentCart ? (JSON.parse(currentCart) as CartItem[]) : [];
    } catch {
      cart = [];
    }

    const existingItem = cart.find(
      (item) =>
        item.productId === product.id && item.variant === variantLabel
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: pricing.final,
        variant: variantLabel,
        quantity,
        image: color?.images[0] || product.imageUrl || undefined,
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("rca-cart-updated"));

    // Abre el carrito lateral: ahí está el botón para consultar por WhatsApp
    window.dispatchEvent(new Event("rca-open-cart"));

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2500);
  }

  return (
    <div>
      {/* Capacidad */}
      {storages.length > 0 && (
        <div>
          <p className="text-sm text-slate-500">Elige capacidad</p>

          <div className="mt-3 flex flex-wrap gap-3">
            {storages.map((item, index) => {
              const itemPricing = getStoragePricing(product, index);
              const active = selectedStorage === index;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onStorageChange(index)}
                  className={`min-w-[104px] rounded-xl border px-4 py-3 text-left transition ${
                    active
                      ? "border-brand bg-blue-50 ring-2 ring-brand/20"
                      : "border-line bg-white hover:border-brand"
                  }`}
                >
                  <span className="block text-sm font-bold">{item.label}</span>

                  <span
                    className={`mt-0.5 block text-xs font-semibold ${
                      active ? "text-brand" : "text-slate-500"
                    }`}
                  >
                    S/ {itemPricing.final}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Color */}
      {colors.length > 0 && (
        <div className={storages.length > 0 ? "mt-6" : ""}>
          <p className="text-sm text-slate-500">
            Color:{" "}
            <span className="font-semibold text-slate-950">{color?.name}</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            {colors.map((item, index) => {
              const active = selectedColor === index;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => onColorChange(index)}
                  aria-label={`Color ${item.name}`}
                  title={item.name}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                    active
                      ? "border-brand"
                      : "border-transparent hover:border-slate-300"
                  }`}
                >
                  <span
                    className="h-7 w-7 rounded-full border border-slate-300 shadow-inner"
                    style={{ backgroundColor: getColorHex(item) }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Cantidad */}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-full border border-line bg-white">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            aria-label="Disminuir cantidad"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus size={16} />
          </button>

          <span className="min-w-10 text-center text-base font-semibold">
            {quantity}
          </span>

          <button
            type="button"
            onClick={() =>
              setQuantity((value) =>
                availableStock > 0 ? Math.min(availableStock, value + 1) : value
              )
            }
            disabled={!canBuy || quantity >= availableStock}
            aria-label="Aumentar cantidad"
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 transition hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={16} />
          </button>
        </div>

      </div>

      {!canBuy && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          Este producto no tiene stock disponible por ahora. Puedes consultar
          por WhatsApp.
        </div>
      )}

      {/* Acciones */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={addToCart}
          disabled={!canBuy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? <Check size={17} /> : <ShoppingCart size={17} />}
          {added ? "Agregado" : "Añadir al carrito"}
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-green-500 px-5 text-sm font-semibold text-white shadow-lg shadow-green-200 transition hover:bg-green-600"
        >
          <WhatsAppIcon size={17} />
          Consultar por WhatsApp
        </a>
      </div>
    </div>
  );
}
