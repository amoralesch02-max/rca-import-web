"use client";

import CartDrawer from "@/components/CartDrawer";
import ChristmasCountdown from "@/components/navidad/ChristmasCountdown";
import { getCategoryIcon } from "@/lib/category-icons";
import { buildCatalogMenu, type CatalogMenuData } from "@/lib/catalog-menu";
import Image from "next/image";
import Link from "next/link";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseProducts } from "@/lib/supabase-products";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import { getSupabaseCategories } from "@/lib/supabase-taxonomies";
import {
  BadgePercent,
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  PackageSearch,
  PhoneCall,
  ShoppingCart,
  Snowflake,
  Users,
  X,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

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

// Los datos del menú se piden una sola vez y se reutilizan entre páginas
let menuDataPromise: Promise<CatalogMenuData> | null = null;

function loadMenuData() {
  if (!menuDataPromise) {
    menuDataPromise = Promise.all([
      getSupabaseProducts(),
      getSupabaseCategories(),
    ])
      .then(([products, categories]) => buildCatalogMenu(products, categories))
      .catch((error) => {
        menuDataPromise = null;
        throw error;
      });
  }

  return menuDataPromise;
}

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

/**
 * Avisa al menú si se está viendo el catálogo mayorista (?tipo=mayorista).
 * Va aparte y dentro de <Suspense> porque useSearchParams lo exige en Next.
 */
function WholesaleWatcher({ onChange }: { onChange: (value: boolean) => void }) {
  const params = useSearchParams();
  const isWholesale = params.get("tipo") === "mayorista";

  useEffect(() => {
    onChange(isWholesale);
  }, [isWholesale, onChange]);

  return null;
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [wholesaleView, setWholesaleView] = useState(false);

  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartOpen, setCartOpen] = useState(false);

  // Menú desplegable de "Catálogo"
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [menuData, setMenuData] = useState<CatalogMenuData | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  function ensureMenuData() {
    if (!menuData) {
      loadMenuData()
        .then(setMenuData)
        .catch(() => undefined);
    }
  }

  function openCatalogMenu() {
    window.clearTimeout(closeTimer.current);
    setCatalogOpen(true);
    ensureMenuData();
  }

  // Un pequeño retraso evita que se cierre al pasar el mouse del botón al panel
  function scheduleCloseCatalogMenu() {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setCatalogOpen(false), 160);
  }

  // Se precargan los datos en un momento libre, para que el menú abra al instante
  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadMenuData()
        .then(setMenuData)
        .catch(() => undefined);
    }, 1500);

    return () => window.clearTimeout(timer);
  }, []);

  // Escape cierra el menú
  useEffect(() => {
    if (!catalogOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCatalogOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [catalogOpen]);

  const iphoneCategory = encodeURIComponent(menuData?.iphoneCategory ?? "iPhones");
  const newPhonesHref = `/catalogo?categoria=${iphoneCategory}&condicion=nuevo`;
  const usedPhonesHref = `/catalogo?categoria=${iphoneCategory}&condicion=seminuevo`;
  const [bump, setBump] = useState(false);
  const previousCount = useRef(0);

  // Nombre de la tienda: primera palabra en rojo, el resto en azul
  const [nameFirst, ...nameRestWords] = settings.storeName.trim().split(/\s+/);
  const nameRest = nameRestWords.join(" ");

  // Header compacto al bajar: pasados 60 px se oculta el eslogan y se achica
  // el logo; vuelve al subir cerca del inicio. Solo se animan transformaciones
  // y opacidad (no alturas), por eso el cambio es suave y no mueve la página.
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const y = window.scrollY;

      setCompact((current) => (current ? y > 24 : y > 60));
    }

    function handleScroll() {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  // El carrito "rebota" solo cuando se AGREGA un producto
  // (no al cargar la página ni al quitar productos)
  useEffect(() => {
    previousCount.current = getCartCount();

    function handleCartUpdated() {
      const next = getCartCount();

      if (next > previousCount.current) {
        setBump(true);
        window.setTimeout(() => setBump(false), 500);
      }

      previousCount.current = next;
    }

    window.addEventListener("rca-cart-updated", handleCartUpdated);

    return () => {
      window.removeEventListener("rca-cart-updated", handleCartUpdated);
    };
  }, []);

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
    setCatalogOpen(false);
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

    // "Mayorista" es el catálogo con ?tipo=mayorista
    if (href.includes("?")) {
      return pathname.startsWith("/catalogo") && wholesaleView;
    }

    // "Catálogo" no se marca cuando se está viendo el mayorista
    if (href === "/catalogo") {
      return pathname.startsWith("/catalogo") && !wholesaleView;
    }

    return pathname.startsWith(href);
  }

  return (
    <>
      <Suspense fallback={null}>
        <WholesaleWatcher onChange={setWholesaleView} />
      </Suspense>

      {/* Barra superior fina: va fuera del header fijo, así al bajar se va
          con la página de forma natural (sin animar su altura) */}
      <div className="bg-slate-950 text-center text-[11px] font-semibold tracking-wide text-blue-200">
          <p className="nv-off mx-auto max-w-7xl px-4 py-1.5">
            Envíos a todo el Perú · Atención directa por WhatsApp
          </p>

          {/* Solo en Navidad: cuenta regresiva */}
          <p className="nv-only relative mx-auto max-w-7xl px-4 py-1.5">
            <Snowflake
              size={16}
              className="absolute left-4 top-1/2 hidden -translate-y-1/2 text-sky-100/80 md:block"
            />
            <ChristmasCountdown />
            <Snowflake
              size={20}
              className="absolute right-4 top-1/2 hidden -translate-y-1/2 text-sky-100/80 md:block"
            />
          </p>
      </div>

      <header
        data-compact={compact ? "true" : undefined}
        className={`sticky top-0 z-50 border-b border-line bg-white/95 text-slate-950 transition-shadow duration-500 ${
          compact ? "shadow-md shadow-slate-200/80" : "shadow-sm shadow-slate-200/60"
        }`}
      >
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 md:px-6">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-2.5"
            aria-label="Ir al inicio de RCA IMPORT"
          >
            {/* Emblema del logo (sin el texto, que va al lado en grande) */}
            <Image
              src="/logo-mark.webp"
              alt="Logo RCA IMPORT"
              width={240}
              height={132}
              sizes="96px"
              priority
              className={`h-10 w-auto shrink-0 origin-left transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:h-11 ${
                compact ? "scale-[0.82]" : "scale-100 group-hover:scale-105"
              }`}
            />

            {/* Nombre: al compactar se corre a la izquierda (lo que se achicó el logo)
                y baja un poco para quedar centrado sin el eslogan */}
            <span
              className={`min-w-0 leading-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                compact
                  ? "-translate-x-[13px] translate-y-[7px] md:-translate-x-[14px]"
                  : "translate-x-0 translate-y-0"
              }`}
            >
              {/* Primera palabra en rojo y el resto en azul, como el logo */}
              <span className="block truncate text-lg font-extrabold italic tracking-tight md:text-xl">
                <span className="text-alert">{nameFirst}</span>
                {nameRest && <span className="text-brand"> {nameRest}</span>}
              </span>

              {settings.slogan && (
                <span
                  className={`mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition-[opacity,transform,filter] duration-300 ease-out min-[380px]:block md:text-[10px] ${
                    compact
                      ? "-translate-y-1 opacity-0 blur-[2px]"
                      : "translate-y-0 opacity-100 blur-0"
                  }`}
                >
                  {settings.slogan}
                </span>
              )}
            </span>
          </Link>

          {/* Navegación escritorio */}
          <nav className="hidden items-center gap-1 rounded-full border border-line bg-bg p-1 lg:flex">
            {navItems.map((item) => {
              const active = isActiveLink(item.href);

              if (item.href === "/catalogo") {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={openCatalogMenu}
                    onMouseLeave={scheduleCloseCatalogMenu}
                    onFocus={openCatalogMenu}
                    aria-haspopup="true"
                    aria-expanded={catalogOpen}
                    className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-brand text-white"
                        : catalogOpen
                        ? "bg-white text-brand"
                        : "text-slate-600 hover:bg-white hover:text-brand"
                    }`}
                  >
                    {item.name}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        catalogOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Link>
                );
              }

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
              data-cart-target
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-slate-950 transition hover:border-brand hover:text-brand ${bump ? "animate-bump" : ""}`}
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
              data-cart-target
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-slate-950 ${bump ? "animate-bump" : ""}`}
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

          {/* Menú desplegable de Catálogo (solo escritorio) */}
          {catalogOpen && (
            <div
              className="absolute left-1/2 top-full z-50 hidden w-[min(900px,calc(100%-2.5rem))] -translate-x-1/2 pt-2 lg:block"
              onMouseEnter={openCatalogMenu}
              onMouseLeave={scheduleCloseCatalogMenu}
            >
              <div className="animate-fade-in overflow-hidden rounded-3xl border border-line bg-white shadow-2xl shadow-slate-300/50">
                <div className="grid grid-cols-[1.15fr_1fr_1fr] gap-6 p-6">
                  {/* Productos */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Productos
                    </p>

                    <div className="mt-4 grid gap-4">
                      {(!menuData || menuData.newCount > 0) && (
                        <Link
                          href={newPhonesHref}
                          onClick={() => setCatalogOpen(false)}
                          className="group block"
                        >
                          <p className="font-semibold transition group-hover:text-brand">
                            iPhone nuevos
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {menuData
                              ? `${menuData.newCount} ${
                                  menuData.newCount === 1 ? "equipo" : "equipos"
                                }`
                              : "Equipos nuevos"}
                          </p>
                        </Link>
                      )}

                      {(!menuData || menuData.usedCount > 0) && (
                        <Link
                          href={usedPhonesHref}
                          onClick={() => setCatalogOpen(false)}
                          className="group block"
                        >
                          <p className="font-semibold transition group-hover:text-brand">
                            iPhone seminuevos
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500">
                            {menuData
                              ? `${menuData.usedCount} ${
                                  menuData.usedCount === 1 ? "equipo" : "equipos"
                                }`
                              : "Equipos seminuevos"}
                          </p>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Por modelo */}
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Por modelo
                    </p>

                    <div className="mt-4 grid gap-3">
                      {menuData ? (
                        menuData.models.length > 0 ? (
                          menuData.models.map((model) => (
                            <Link
                              key={model.query}
                              href={`/catalogo?categoria=${iphoneCategory}&q=${encodeURIComponent(
                                model.query
                              )}`}
                              onClick={() => setCatalogOpen(false)}
                              className="font-medium text-slate-700 transition hover:text-brand"
                            >
                              {model.label}
                            </Link>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">
                            Pronto más modelos.
                          </p>
                        )
                      ) : (
                        <div className="grid gap-3">
                          {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="skeleton h-4 w-24 rounded" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Explora más */}
                  <div className="rounded-2xl bg-bg p-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      Explora más
                    </p>

                    {menuData && menuData.otherCategories.length > 0 && (
                      <div className="mt-4 grid gap-3">
                        {menuData.otherCategories.map((category) => {
                          const Icon = getCategoryIcon(
                            category.name,
                            category.slug
                          );

                          return (
                            <Link
                              key={category.slug}
                              href={`/categoria/${category.slug}`}
                              onClick={() => setCatalogOpen(false)}
                              className="flex items-center gap-2.5 font-medium text-slate-700 transition hover:text-brand"
                            >
                              <Icon size={16} className="text-brand" />
                              {category.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}

                    <Link
                      href="/catalogo"
                      onClick={() => setCatalogOpen(false)}
                      className="mt-5 inline-block font-semibold text-brand transition hover:text-brand-hover"
                    >
                      Ver todo el catálogo →
                    </Link>

                    {menuData?.lowestPrice != null && (
                      <p className="mt-2 text-sm text-slate-500">
                        Desde S/ {menuData.lowestPrice}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
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

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={newPhonesHref}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-brand/30 bg-blue-50 px-4 py-3 text-center text-sm font-semibold text-brand"
                >
                  iPhone nuevos
                </Link>

                <Link
                  href={usedPhonesHref}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-brand/30 bg-blue-50 px-4 py-3 text-center text-sm font-semibold text-brand"
                >
                  iPhone seminuevos
                </Link>
              </div>

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
