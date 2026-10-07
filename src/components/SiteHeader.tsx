"use client";

import CartDrawer from "@/components/CartDrawer";
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
  PackageSearch,
  PhoneCall,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type CartItem = {
  quantity: number;
};

const navItems = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Nosotros", href: "/nosotros", icon: Users },
  { name: "Catálogo", href: "/catalogo", icon: PackageSearch },
  { name: "Mayorista", href: "/catalogo?tipo=mayorista", icon: BadgePercent },
  { name: "Contacto", href: "/contacto", icon: PhoneCall },
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
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const supabaseSettings = await getSupabaseStoreSettings();
      setSettings(supabaseSettings);
    }

    function refreshCartCount() {
      setCartCount(getCartCount());
    }

    function openCart() {
      setCartOpen(true);
    }

    loadSettings();
    refreshCartCount();

    window.addEventListener("storage", refreshCartCount);
    window.addEventListener("focus", refreshCartCount);
    window.addEventListener("rca-cart-updated", refreshCartCount);
    window.addEventListener("rca-open-cart", openCart);

    return () => {
      window.removeEventListener("rca-open-cart", openCart);
      window.removeEventListener("storage", refreshCartCount);
      window.removeEventListener("focus", refreshCartCount);
      window.removeEventListener("rca-cart-updated", refreshCartCount);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setCartOpen(false);
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
      <header className="sticky top-0 z-50 border-b border-line bg-white/85 text-slate-950 shadow-sm shadow-slate-200/60 backdrop-blur-xl">
        {/* Barra superior fina */}
        <div className="bg-slate-950 text-center text-[11px] font-semibold tracking-wide text-blue-200">
          <p className="mx-auto max-w-7xl px-4 py-1.5">
            Envíos a todo el Perú · Atención directa por WhatsApp
          </p>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-6">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
            aria-label="Ir al inicio de RCA IMPORT"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 transition group-hover:scale-105">
              <Image
                src="/logo-rca.png"
                alt="Logo RCA IMPORT"
                fill
                sizes="40px"
                className="object-contain p-1"
                priority
              />
            </div>

            <p className="truncate text-base font-bold tracking-tight md:text-lg">
              {settings.storeName}
            </p>
          </Link>

          {/* Navegación escritorio */}
          <nav className="hidden items-center gap-1 rounded-full border border-line bg-bg p-1 lg:flex">
            {navItems.map((item) => {
              const active = isActiveLink(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-brand text-white"
                      : "text-slate-600 hover:bg-white hover:text-brand"
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Acciones escritorio */}
          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-slate-950 transition hover:border-brand hover:text-brand"
              aria-label="Ver carrito"
            >
              <ShoppingCart size={18} />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-alert px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              <WhatsAppIcon size={16} />
              WhatsApp
            </a>
          </div>

          {/* Acciones móvil */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-slate-950"
              aria-label="Ver carrito"
            >
              <ShoppingCart size={18} />

              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-alert px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {menuOpen && (
          <div className="border-t border-line bg-white px-5 py-4 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveLink(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      active
                        ? "border-brand bg-blue-50 text-brand"
                        : "border-line bg-bg text-slate-700 hover:border-brand"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={18} className="text-brand" />
                      {item.name}
                    </span>
                    <ChevronRight size={16} className="text-slate-500" />
                  </Link>
                );
              })}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white"
              >
                <WhatsAppIcon size={17} />
                Escribir por WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        whatsappNumber={settings.whatsappMain}
      />

      {menuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden"
        />
      )}
    </>
  );
}
