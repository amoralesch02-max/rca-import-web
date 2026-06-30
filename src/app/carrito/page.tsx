"use client";

import ConfirmModal from "@/components/ConfirmModal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  Wallet,
  X,
} from "lucide-react";

type CartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  variant: string;
  quantity: number;
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
  const [clearModalOpen, setClearModalOpen] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabaseSettings = await getSupabaseStoreSettings();
      setSettings(supabaseSettings);
    }

    loadSettings();
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
            )}\n\nTotal aproximado: S/ ${total}\n\nQuiero coordinar compra, separación y envío.`
        : "Hola RCA IMPORT, vengo de la web y quiero consultar productos disponibles.";

    return getWhatsappUrl(settings.whatsappMain, message);
  }, [settings.whatsappMain, cart, total]);

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <Link href="/" className="transition hover:text-[#0057A8]">
            Inicio
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <Link href="/catalogo" className="transition hover:text-[#0057A8]">
            Catálogo
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <span className="text-slate-950">Carrito</span>
        </div>

        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300 md:p-12">
          <div className="absolute right-[-150px] top-[-170px] h-96 w-96 rounded-full bg-[#0057A8]/30 blur-3xl" />
          <div className="absolute bottom-[-200px] left-[-130px] h-96 w-96 rounded-full bg-[#E31B23]/25 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                <ShoppingBag size={16} />
                Carrito RCA IMPORT
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Revisa tu selección antes de separar.
              </h1>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-300 md:text-base">
                Confirma cantidades, colores y total aproximado. Luego puedes
                separar con adelanto o consultar por WhatsApp.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <ArrowLeft size={18} />
                  Seguir comprando
                </Link>

                {cart.length > 0 && (
                  <Link
                    href="/separar"
                    className="inline-flex items-center gap-2 rounded-full bg-[#E31B23] px-6 py-4 text-sm font-black text-white shadow-lg shadow-red-950/20 transition hover:bg-red-700"
                  >
                    <Wallet size={18} />
                    Separar ahora
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <SummaryMiniCard label="Productos" value={cart.length} />
              <SummaryMiniCard label="Unidades" value={totalUnits} />
              <SummaryMiniCard label="Total" value={`S/ ${total}`} large />
              <SummaryMiniCard label="Proceso" value="Manual" />
            </div>
          </div>
        </section>

        {cart.length === 0 ? (
          <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),radial-gradient(circle_at_bottom_right,#fee2e2,transparent_35%)] p-10 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-slate-300">
                <ShoppingBag size={52} />
              </div>

              <h2 className="mt-6 text-3xl font-black">
                Tu carrito está vacío
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-7 text-slate-500">
                Agrega productos desde el catálogo para poder separar, consultar
                stock o coordinar envío con RCA IMPORT.
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0057A8] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  Ver catálogo
                  <ChevronRight size={18} />
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  <MessageCircle size={18} />
                  Consultar por WhatsApp
                </a>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.38fr]">
            <div className="space-y-4">
              {cart.map((item, index) => (
                <article
                  key={`${item.productId}-${item.variant}`}
                  className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200"
                >
                  <div className="grid gap-5 p-5 md:grid-cols-[130px_1fr_auto] md:items-center">
                    <Link
                      href={`/producto/${item.slug}`}
                      className="relative flex h-32 items-center justify-center overflow-hidden rounded-[1.7rem] bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_45%),radial-gradient(circle_at_bottom_right,#fee2e2,transparent_45%)]"
                    >
                      <div className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 shadow-sm">
                        #{index + 1}
                      </div>

                      <ShoppingBag className="text-slate-800" size={50} />
                    </Link>

                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#0057A8]">
                          {item.variant || "Color único"}
                        </span>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          S/ {item.price} c/u
                        </span>
                      </div>

                      <Link
                        href={`/producto/${item.slug}`}
                        className="mt-3 block text-2xl font-black leading-tight text-slate-950 transition hover:text-[#0057A8]"
                      >
                        {item.name}
                      </Link>

                      <p className="mt-2 text-sm font-semibold text-slate-500">
                        Subtotal del producto:
                        <span className="ml-2 font-black text-[#E31B23]">
                          S/ {item.price * item.quantity}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-[#f6f8fc] p-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            decreaseItem(item.productId, item.variant)
                          }
                          disabled={item.quantity <= 1}
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Minus size={17} />
                        </button>

                        <span className="flex h-10 min-w-12 items-center justify-center rounded-full px-3 text-lg font-black text-slate-950">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            increaseItem(item.productId, item.variant)
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0057A8] text-white shadow-sm transition hover:bg-blue-700"
                        >
                          <Plus size={17} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variant)}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#E31B23] transition hover:bg-[#E31B23] hover:text-white"
                        aria-label="Eliminar producto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <aside className="h-fit rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-32">
              <div className="rounded-[1.7rem] bg-slate-950 p-6 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-blue-300">
                    <Wallet size={24} />
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">
                      Resumen
                    </p>

                    <h2 className="mt-1 text-2xl font-black">Tu pedido</h2>
                  </div>
                </div>

                <div className="mt-6 space-y-4 text-sm font-semibold text-slate-300">
                  <div className="flex justify-between gap-3">
                    <span>Productos diferentes</span>
                    <span className="font-black text-white">{cart.length}</span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span>Total unidades</span>
                    <span className="font-black text-white">{totalUnits}</span>
                  </div>

                  <div className="border-t border-white/10 pt-5">
                    <div className="flex items-end justify-between gap-3">
                      <span className="font-black text-white">
                        Total aproximado
                      </span>

                      <span className="text-4xl font-black text-white">
                        S/ {total}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/separar"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#E31B23] px-5 py-4 text-center text-sm font-black text-white shadow-lg shadow-red-100 transition hover:bg-red-700"
                >
                  <Wallet size={18} />
                  Separar con adelanto
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 py-4 text-center text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
                >
                  <MessageCircle size={18} />
                  Consultar por WhatsApp
                </a>

                <Link
                  href="/catalogo"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-center text-sm font-black text-slate-700 transition hover:bg-slate-200"
                >
                  <ArrowLeft size={18} />
                  Seguir comprando
                </Link>

                <button
                  type="button"
                  onClick={() => setClearModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-center text-sm font-black text-[#E31B23] transition hover:bg-[#E31B23] hover:text-white"
                >
                  <Trash2 size={18} />
                  Vaciar carrito
                </button>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-[#f6f8fc] p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="shrink-0 text-[#0057A8]" />

                  <p className="text-xs font-semibold leading-6 text-slate-500">
                    El total es referencial. El envío, disponibilidad final y la
                    separación se coordinan con RCA IMPORT por WhatsApp.
                  </p>
                </div>
              </div>
            </aside>
          </section>
        )}

        {cart.length > 0 && (
          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: BadgeCheck,
                title: "Reserva validada",
                text: "Tu separación quedará pendiente hasta validar el comprobante de pago.",
              },
              {
                icon: Truck,
                title: "Envíos coordinados",
                text: "El envío se confirma por WhatsApp según ciudad y disponibilidad.",
              },
              {
                icon: PackageCheck,
                title: "Stock actualizado",
                text: "Los productos se administran desde el panel interno de RCA IMPORT.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8]">
                    <item.icon size={23} />
                  </div>

                  <div>
                    <p className="font-black">{item.title}</p>

                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                      {item.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>
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

function SummaryMiniCard({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string | number;
  large?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur ${
        large ? "col-span-2" : ""
      }`}
    >
      <Sparkles className="text-blue-200" size={24} />

      <p className="mt-4 truncate text-3xl font-black">{value}</p>

      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
        {label}
      </p>
    </div>
  );
}