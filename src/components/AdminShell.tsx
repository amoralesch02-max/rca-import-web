"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  BarChart3,
  Building2,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  Flag,
  Home,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Wallet,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const adminLinks = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Resumen general",
  },
  {
    label: "Productos",
    href: "/admin/productos",
    icon: Package,
    description: "Catálogo y stock",
  },
  {
    label: "Categorías",
    href: "/admin/categorias",
    icon: Tags,
    description: "Tipos de producto",
  },
  {
    label: "Marcas",
    href: "/admin/marcas",
    icon: Building2,
    description: "Marcas disponibles",
  },
  {
    label: "Países",
    href: "/admin/paises",
    icon: Flag,
    description: "Origen de importación",
  },
  {
    label: "Reservas",
    href: "/admin/reservas",
    icon: ClipboardList,
    description: "Separaciones",
  },
  {
    label: "Pagos",
    href: "/admin/pagos",
    icon: Wallet,
    description: "Validación Yape",
  },
  {
    label: "Banners",
    href: "/admin/banners",
    icon: ImageIcon,
    description: "Portada visual",
  },
  {
    label: "Configuración",
    href: "/admin/configuracion",
    icon: Settings,
    description: "Datos de tienda",
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem("rca_import_admin_session");
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white lg:block">
          <div className="sticky top-0 flex h-screen flex-col p-5">
            <AdminBrand />

            <nav className="mt-6 space-y-2 overflow-y-auto pr-1">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                      isActive
                        ? "bg-[#0057A8] text-white shadow-lg shadow-blue-100"
                        : "text-slate-600 hover:bg-[#f6f8fc] hover:text-slate-950"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-[#0057A8]"
                      }`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate">{item.label}</p>

                      <p
                        className={`mt-0.5 truncate text-[11px] font-bold ${
                          isActive ? "text-blue-100" : "text-slate-400"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto space-y-3 pt-5">
              <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
                <div className="flex gap-3">
                  <ShieldCheck className="shrink-0 text-blue-300" size={22} />

                  <div>
                    <p className="text-sm font-black">Panel protegido</p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
                      Acceso solo para administrador de RCA IMPORT.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/"
                target="_blank"
                className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-100 hover:text-[#0057A8]"
              >
                <span className="flex items-center gap-3">
                  <Home size={18} />
                  Ver tienda
                </span>

                <ExternalLink size={15} />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-[#E31B23] transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-2xl lg:static">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:py-5">
              <div className="flex min-w-0 items-center gap-3 lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg shadow-slate-200"
                  aria-label="Abrir menú administrador"
                >
                  <Menu size={22} />
                </button>

                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                  <Image
                    src="/logo-rca.png"
                    alt="Logo RCA IMPORT"
                    fill
                    sizes="48px"
                    className="object-contain p-1"
                    priority
                  />
                </div>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#E31B23] md:text-sm">
                  Admin RCA IMPORT
                </p>

                <h1 className="mt-1 truncate text-3xl font-black tracking-tight md:mt-2 md:text-5xl">
                  {title}
                </h1>

                <p className="mt-2 hidden max-w-2xl text-sm font-semibold leading-6 text-slate-500 md:block">
                  {description}
                </p>
              </div>

              <div className="hidden items-center gap-3 rounded-full bg-green-50 px-4 py-3 text-sm font-black text-green-700 md:flex">
                <BarChart3 size={18} />
                Modo visual
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-7xl px-5 py-6 md:py-8">
            <div className="mb-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:hidden">
              <div className="flex gap-3">
                <Sparkles className="shrink-0 text-[#0057A8]" />

                <p className="text-sm font-semibold leading-6 text-slate-500">
                  Estás administrando productos, reservas, pagos, banners y
                  configuración general de RCA IMPORT.
                </p>
              </div>
            </div>

            {children}
          </div>
        </section>
      </div>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú administrador"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm lg:hidden"
          />

          <aside className="fixed inset-y-0 left-0 z-[60] flex w-[88%] max-w-sm flex-col bg-white shadow-2xl shadow-slate-950/30 lg:hidden">
            <div className="border-b border-slate-200 p-5">
              <div className="flex items-center justify-between gap-4">
                <AdminBrand compact />

                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                  aria-label="Cerrar menú"
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto p-5">
              {adminLinks.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                      isActive
                        ? "border-[#0057A8] bg-blue-50 text-[#0057A8]"
                        : "border-slate-200 bg-white text-slate-700 hover:border-[#0057A8] hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                          isActive
                            ? "bg-[#0057A8] text-white"
                            : "bg-[#f6f8fc] text-slate-600 group-hover:bg-white group-hover:text-[#0057A8]"
                        }`}
                      >
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-black">{item.label}</p>

                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <ChevronRight size={18} className="shrink-0" />
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-200 p-5">
              <div className="grid gap-3">
                <Link
                  href="/"
                  target="_blank"
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white"
                >
                  <Home size={18} />
                  Ver tienda
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 py-4 text-sm font-black text-[#E31B23]"
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </main>
  );
}

function AdminBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/admin"
      className={`flex items-center gap-3 rounded-3xl bg-[#f6f8fc] ${
        compact ? "p-0 bg-transparent" : "p-4"
      }`}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <Image
          src="/logo-rca.png"
          alt="Logo RCA IMPORT"
          fill
          sizes="48px"
          className="object-contain p-1"
          priority
        />
      </div>

      <div className="min-w-0">
        <p className="truncate font-black">RCA IMPORT</p>

        <p className="truncate text-xs font-semibold text-slate-500">
          Panel administrador
        </p>
      </div>
    </Link>
  );
}