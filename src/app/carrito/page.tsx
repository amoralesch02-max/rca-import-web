"use client";

import ConfirmModal from "@/components/ConfirmModal";
import ProductImage from "@/components/ProductImage";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseProducts } from "@/lib/supabase-products";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";

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

function getStoredCart() {
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

export default function CartPage() {
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [images, setImages] = useState<Record<string, string>>({});
  const [clearModalOpen, setClearModalOpen] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabaseSettings = await getSupabaseStoreSettings();
      setSettings(supabaseSettings);
    }

    // El carrito guardado no incluye fotos: se buscan por slug
    async function loadImages() {
      const products = await getSupabaseProducts();
      const map: Record<string, string> = {};

      products.forEach((product) => {
        if (product.imageUrl) {
          map[product.slug] = product.imageUrl;
        }
      });

      setImages(map);
    }

    loadSettings();
    loadImages();
    setCart(getStoredCart());
  }, []);

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
    const newCart = cart.map((item) =>
      item.productId === productId && item.variant === variant
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );

    saveCart(newCart);
  }

  function decreaseItem(productId: number, variant: string) {
    const newCart = cart.map((item) =>
      item.productId === productId && item.variant === variant
        ? { ...item, quantity: Math.max(1, item.quantity - 1) }
        : item
    );

    saveCart(newCart);
  }

  function removeItem(productId: number, variant: string) {
    const newCart = cart.filter(
      (item) => !(item.productId === productId && item.variant === variant)
    );

    saveCart(newCart);
  }

  function confirmClearCart() {
    saveCart([]);
    setClearModalOpen(false);
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

    return getWhatsappUrl(settings.whatsappMain, message);
  }, [settings.whatsappMain, cart, total]);

  return (
    <main className="min-h-screen bg-bg text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
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

          <span className="text-slate-700">Carrito</span>
        </nav>

        <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
          Tu carrito
        </h1>

        {cart.length > 0 && (
          <p className="mt-1 text-sm text-slate-500">
            {cart.length} {cart.length === 1 ? "producto" : "productos"} ·{" "}
            {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}
          </p>
        )}

        {cart.length === 0 ? (
          /* ================= CARRITO VACÍO ================= */
          <div className="mt-8 rounded-2xl border border-line bg-white p-10 text-center md:p-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-brand">
              <ShoppingBag size={36} />
            </div>

            <h2 className="mt-6 text-2xl font-bold">Tu carrito está vacío</h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Agrega productos desde el catálogo para armar tu pedido y
              consultarlo por WhatsApp con RCA IMPORT.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/catalogo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-8 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-brand-hover"
              >
                Ver catálogo
                <ChevronRight size={16} />
              </Link>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-green-600 px-8 text-sm font-semibold text-green-700 transition hover:bg-green-50"
              >
                <WhatsAppIcon size={17} />
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
            {/* ================= PRODUCTOS ================= */}
            <div>
              <ul className="grid gap-4">
                {cart.map((item) => (
                  <li
                    key={`${item.productId}-${item.variant}`}
                    className="flex gap-4 rounded-2xl border border-line bg-white p-4 md:gap-5 md:p-5"
                  >
                    <Link
                      href={`/producto/${item.slug}`}
                      className="block h-24 w-24 shrink-0 overflow-hidden rounded-xl md:h-28 md:w-28"
                    >
                      <ProductImage
                        src={item.image || images[item.slug]}
                        alt={item.name}
                        sizes="112px"
                        className="h-full w-full"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/producto/${item.slug}`}
                            className="line-clamp-2 text-base font-semibold leading-snug transition hover:text-brand md:text-lg"
                          >
                            {item.name}
                          </Link>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-brand">
                              {item.variant || "Color único"}
                            </span>

                            <span className="rounded-md bg-bg px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                              S/ {item.price} c/u
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId, item.variant)}
                          aria-label={`Eliminar ${item.name}`}
                          className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-alert"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                        <div className="flex items-center rounded-full border border-line bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseItem(item.productId, item.variant)
                            }
                            disabled={item.quantity <= 1}
                            aria-label="Disminuir cantidad"
                            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus size={16} />
                          </button>

                          <span className="min-w-10 text-center text-base font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              increaseItem(item.productId, item.variant)
                            }
                            aria-label="Aumentar cantidad"
                            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-bg"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <p className="text-xl font-bold">
                          S/ {item.price * item.quantity}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand transition hover:text-brand-hover"
                >
                  <ArrowLeft size={16} />
                  Seguir comprando
                </Link>

                <button
                  type="button"
                  onClick={() => setClearModalOpen(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-alert"
                >
                  <Trash2 size={15} />
                  Vaciar carrito
                </button>
              </div>
            </div>

            {/* ================= RESUMEN ================= */}
            <aside className="rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-28">
              <h2 className="text-lg font-bold">Resumen del pedido</h2>

              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                <div className="flex justify-between gap-3">
                  <span>Productos diferentes</span>
                  <span className="font-semibold text-slate-950">
                    {cart.length}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span>Total de unidades</span>
                  <span className="font-semibold text-slate-950">
                    {totalUnits}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-3 border-t border-line pt-5">
                <span className="text-sm font-semibold">Total aproximado</span>
                <span className="text-3xl font-bold">S/ {total}</span>
              </div>

              <div className="mt-6 grid gap-3">
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
                  href="/catalogo"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-line text-sm font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
                >
                  Seguir comprando
                </Link>
              </div>

              <div className="mt-5 flex gap-3 rounded-xl bg-blue-50 p-4">
                <ShieldCheck className="mt-0.5 shrink-0 text-brand" size={18} />

                <p className="text-xs leading-5 text-slate-600">
                  El total es referencial. La disponibilidad final, el pago y
                  el envío se coordinan con RCA IMPORT por WhatsApp. Al
                  consultar, se enviará tu pedido ya armado.
                </p>
              </div>
            </aside>
          </div>
        )}

        {/* ================= GARANTÍAS ================= */}
        {cart.length > 0 && (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: BadgeCheck,
                title: "Pedido listo para consultar",
                text: "Al pulsar WhatsApp enviamos tu lista de productos, colores y cantidades.",
              },
              {
                icon: Truck,
                title: "Envíos coordinados",
                text: "El envío se confirma por WhatsApp según ciudad y disponibilidad.",
              },
              {
                icon: PackageCheck,
                title: "Stock actualizado",
                text: "Confirmamos la disponibilidad de cada producto antes de coordinar el pago.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-line bg-white p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
                  <item.icon size={20} />
                </div>

                <div>
                  <p className="text-sm font-semibold">{item.title}</p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />

      <ConfirmModal
        open={clearModalOpen}
        title="Vaciar carrito"
        description="¿Seguro que deseas eliminar todos los productos del carrito? Esta acción no se puede deshacer."
        confirmText="Sí, vaciar"
        cancelText="Cancelar"
        danger
        onCancel={() => setClearModalOpen(false)}
        onConfirm={confirmClearCart}
      />
    </main>
  );
}
