"use client";

import ProductImage from "@/components/ProductImage";
import { getWhatsappUrl } from "@/lib/store-settings";
import {
  getSupabaseProducts,
  type PublicProduct,
} from "@/lib/supabase-products";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Link from "next/link";
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

const CART_KEY = "rca_import_cart";

function getStoredCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedCart = localStorage.getItem(CART_KEY);

  if (!storedCart) {
    return [];
  }

  try {
    return JSON.parse(storedCart) as CartItem[];
  } catch {
    return [];
  }
}

export default function CartDrawer({
  open,
  onClose,
  whatsappNumber,
}: {
  open: boolean;
  onClose: () => void;
  whatsappNumber: string;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Al abrir: leer el carrito y cargar las fotos (el carrito guardado no las trae)
  useEffect(() => {
    if (!open) {
      return;
    }

    setCart(getStoredCart());

    function refreshCart() {
      setCart(getStoredCart());
    }

    window.addEventListener("rca-cart-updated", refreshCart);
    window.addEventListener("storage", refreshCart);

    return () => {
      window.removeEventListener("rca-cart-updated", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, [open]);

  useEffect(() => {
    if (!open || imagesLoaded) {
      return;
    }

    async function loadImages() {
      const products: PublicProduct[] = await getSupabaseProducts();

      const map: Record<string, string> = {};

      products.forEach((product) => {
        if (product.imageUrl) {
          map[product.slug] = product.imageUrl;
        }
      });

      setImages(map);
      setImagesLoaded(true);
    }

    loadImages();
  }, [open, imagesLoaded]);

  // Cerrar con Escape y bloquear el scroll de la página mientras está abierto
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  function saveCart(newCart: CartItem[]) {
    setCart(newCart);

    if (newCart.length === 0) {
      localStorage.removeItem(CART_KEY);
    } else {
      localStorage.setItem(CART_KEY, JSON.stringify(newCart));
    }

    window.dispatchEvent(new Event("rca-cart-updated"));
  }

  function increaseItem(productId: number, variant: string) {
    saveCart(
      cart.map((item) =>
        item.productId === productId && item.variant === variant
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decreaseItem(productId: number, variant: string) {
    saveCart(
      cart.map((item) =>
        item.productId === productId && item.variant === variant
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  }

  function removeItem(productId: number, variant: string) {
    saveCart(
      cart.filter(
        (item) => !(item.productId === productId && item.variant === variant)
      )
    );
  }

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalUnits = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const whatsappUrl = useMemo(() => {
    const message =
      cart.length > 0
        ? `Hola RCA IMPORT, quiero consultar por mi carrito:\n\n${cart
            .map(
              (item) =>
                `- ${item.name} | Color: ${item.variant || "Color único"} | Cantidad: ${item.quantity} | Precio: S/ ${item.price}`
            )
            .join(
              "\n"
            )}\n\nTotal aproximado: S/ ${total}\n\nQuiero coordinar la compra y el envío.`
        : "Hola RCA IMPORT, vengo de la web y quiero consultar productos disponibles.";

    return getWhatsappUrl(whatsappNumber, message);
  }, [whatsappNumber, cart, total]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label="Tu carrito">
      <button
        type="button"
        aria-label="Cerrar carrito"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-slate-950/50"
      />

      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white text-slate-950 shadow-2xl">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">Tu carrito</h2>

            {cart.length > 0 && (
              <p className="text-xs text-slate-500">
                {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-bg hover:text-slate-950"
          >
            <X size={20} />
          </button>
        </div>

        {cart.length === 0 ? (
          /* Carrito vacío */
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-brand">
              <ShoppingBag size={28} />
            </div>

            <p className="mt-5 text-base font-semibold">
              Tu carrito está vacío
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Agrega productos desde el catálogo para verlos aquí.
            </p>

            <Link
              href="/catalogo"
              onClick={onClose}
              className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand px-8 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-brand-hover"
            >
              Ver catálogo
            </Link>
          </div>
        ) : (
          <>
            {/* Productos */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="grid gap-4">
                {cart.map((item) => (
                  <li
                    key={`${item.productId}-${item.variant}`}
                    className="flex gap-3 rounded-2xl border border-line p-3"
                  >
                    <Link
                      href={`/producto/${item.slug}`}
                      onClick={onClose}
                      className="block h-20 w-20 shrink-0 overflow-hidden rounded-xl"
                    >
                      <ProductImage
                        src={item.image || images[item.slug]}
                        alt={item.name}
                        sizes="80px"
                        className="h-full w-full"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/producto/${item.slug}`}
                          onClick={onClose}
                          className="line-clamp-2 text-sm font-semibold leading-snug transition hover:text-brand"
                        >
                          {item.name}
                        </Link>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variant)}
                          aria-label={`Quitar ${item.name}`}
                          className="shrink-0 text-slate-400 transition hover:text-alert"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {item.variant && item.variant !== "Color único" && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.variant}
                        </p>
                      )}

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-full border border-line">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseItem(item.productId, item.variant)
                            }
                            disabled={item.quantity <= 1}
                            aria-label="Disminuir cantidad"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-bg disabled:opacity-40"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="min-w-7 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseItem(item.productId, item.variant)
                            }
                            aria-label="Aumentar cantidad"
                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-bg"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <p className="text-sm font-bold">
                          S/ {item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resumen y acciones */}
            <div className="border-t border-line bg-white px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Total aproximado</p>
                <p className="text-2xl font-bold">S/ {total}</p>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                El envío y el pago se coordinan por WhatsApp.
              </p>

              <div className="mt-4 grid gap-2.5">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-500 text-sm font-semibold text-white shadow-lg shadow-green-200 transition hover:bg-green-600"
                >
                  <WhatsAppIcon size={17} />
                  Consultar por WhatsApp
                </a>

                <Link
                  href="/carrito"
                  onClick={onClose}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-line text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
                >
                  Ver carrito completo
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
