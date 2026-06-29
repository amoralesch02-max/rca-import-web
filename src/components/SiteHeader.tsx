"use client";

import Image from "next/image";
import Link from "next/link";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  BadgePercent,
  ChevronRight,
  Home,
  Menu,
  MessageCircle,
  PackageSearch,
  PhoneCall,
  SearchCheck,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  quantity: number;
};

const navItems = [
  {
    name: "Inicio",
    href: "/",
    description: "Portada principal",
    icon: Home,
  },
  {
    name: "Catálogo",
    href: "/catalogo",
    description: "Productos disponibles",
    icon: PackageSearch,
  },
  {
    name: "Mayorista",
    href: "/catalogo?tipo=mayorista",
    description: "Compras por volumen",
    icon: BadgePercent,
  },
  {
    name: "Contacto",
    href: "/contacto",
    description: "Redes y ubicación",
    icon: PhoneCall,
  },
  {
    name: "Estado",
    href: "/estado-pedido",
    description: "Consulta tu reserva",
    icon: SearchCheck,
  },
];

function getCartCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedCart = localStorage.getItem("rca_import_cart");

  if (!storedCart) {
    return 0;
  }

  try {
    const cart = JSON.parse(storedCart) as CartItem[];
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  } catch {
    return 0;
  }
}

export default function SiteHeader() {
  const pathname = usePathname();

  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    async function loadSettings() {
      const supabaseSettings = await getSupabaseStoreSettings();
      setSettings(supabaseSettings);
    }

    function refreshCartCount() {
      setCartCount(getCartCount());
    }

    loadSettings();
    refreshCartCount();

    window.addEventListener("storage", refreshCartCount);
    window.addEventListener("focus", refreshCartCount);
    window.addEventListener("rca-cart-updated", refreshCartCount);

    return () => {
      window.removeEventListener("storage", refreshCartCount);
      window.removeEventListener("focus", refreshCartCount);
      window.removeEventListener("rca-cart-updated", refreshCartCount);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const whatsappUrl = useMemo(() => {
    return getWhatsappUrl(
      settings.whatsappMain,
      "Hola, vengo de la web de RCA IMPORT. Quisiera consultar stock y precios."
    );
  }, [settings.whatsappMain]);

  function isActiveLink(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    if (href.includes("?")) {
      return false;
    }

    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 shadow-sm shadow-slate-200/60 backdrop-blur-2xl">
        <div className="hidden border-b border-slate-200/70 bg-slate-950 text-white lg:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-blue-200">
              <Sparkles size={14} />
              Importaciones seleccionadas · Tecnología · Accesorios · Mayorista
            </div>

            <div className="flex items-center gap-5 text-xs font-bold text-slate-300">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck size={15} className="text-blue-300" />
                Stock real y atención personalizada
              </span>

              <span className="inline-flex items-center gap-2">
                <MessageCircle size={15} className="text-green-300" />
                WhatsApp: {settings.whatsappMain}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-6">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label="Ir al inicio de RCA IMPORT"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[1.35rem] bg-white shadow-lg shadow-slate-200 ring-1 ring-slate-200 transition group-hover:scale-105">
              <Image
                src="/logo-rca.png"
                alt="Logo RCA IMPORT"
                fill
                sizes="56px"
                className="object-contain p-1.5"
                priority
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-black leading-none text-slate-950 md:text-xl">
                  {settings.storeName}
                </p>

                <span className="hidden rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#0057A8] sm:inline-flex">
                  Import
                </span>
              </div>

              <p className="mt-1 truncate text-xs font-bold text-slate-500">
                {settings.slogan}
              </p>
            </div>
          </Link>

          <nav className="hidden items-center rounded-full border border-slate-200 bg-[#f6f8fc] p-1.5 xl:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActiveLink(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-black transition ${
                    active
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                      : "text-slate-600 hover:bg-white hover:text-[#0057A8] hover:shadow-sm"
                  }`}
                >
                  <Icon size={16} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <Link
              href="/carrito"
              className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-950 shadow-sm transition hover:border-[#0057A8] hover:bg-blue-50 hover:text-[#0057A8]"
              aria-label="Ver carrito"
            >
              <ShoppingCart size={20} />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E31B23] px-1 text-xs font-black text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              className="group inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              <MessageCircle size={18} />
              WhatsApp
              <ChevronRight
                size={16}
                className="transition group-hover:translate-x-0.5"
              />
            </a>
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            <Link
              href="/carrito"
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-950 transition hover:bg-blue-50 hover:text-[#0057A8]"
              aria-label="Ver carrito"
            >
              <ShoppingCart size={20} />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E31B23] px-1 text-xs font-black text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg shadow-slate-200 transition hover:bg-[#0057A8]"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 shadow-2xl shadow-slate-300 xl:hidden">
            <div className="mx-auto max-w-7xl">
              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f6f8fc] p-3">
                <div className="rounded-[1.6rem] bg-slate-950 p-5 text-white">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white">
                      <Image
                        src="/logo-rca.png"
                        alt="Logo RCA IMPORT"
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-lg font-black">
                        {settings.storeName}
                      </p>

                      <p className="mt-1 truncate text-xs font-bold text-slate-300">
                        {settings.slogan}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-950"
                    >
                      <MessageCircle size={17} />
                      WhatsApp
                    </a>

                    <Link
                      href="/carrito"
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-4 py-3 text-sm font-black text-white"
                    >
                      <ShoppingCart size={17} />
                      Carrito {cartCount > 0 ? `(${cartCount})` : ""}
                    </Link>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActiveLink(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`group flex items-center justify-between gap-4 rounded-[1.4rem] border p-4 shadow-sm transition ${
                          active
                            ? "border-[#0057A8] bg-blue-50 text-[#0057A8]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-[#0057A8] hover:bg-blue-50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              active
                                ? "bg-[#0057A8] text-white"
                                : "bg-[#f6f8fc] text-slate-700 group-hover:bg-white group-hover:text-[#0057A8]"
                            }`}
                          >
                            <Icon size={20} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-black">{item.name}</p>

                            <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <ChevronRight size={18} className="shrink-0" />
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="shrink-0 text-[#0057A8]" />

                    <p className="text-sm font-semibold leading-6 text-slate-500">
                      Atención personalizada, productos importados y validación
                      de reservas por WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/10 xl:hidden"
        />
      )}
    </>
  );
}