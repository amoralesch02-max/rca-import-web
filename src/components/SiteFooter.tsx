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
  BadgeCheck,
  ChevronRight,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const catalogLinks = [
  { label: "Todos los productos", href: "/catalogo" },
  { label: "iPhones", href: "/categoria/iphones" },
  { label: "Accesorios", href: "/categoria/accesorios" },
  { label: "Cables", href: "/categoria/cables" },
  { label: "Cubos", href: "/categoria/cubos" },
  { label: "Cases", href: "/categoria/cases" },
];

const supportLinks = [
  { label: "Contacto", href: "/contacto" },
  { label: "Carrito", href: "/carrito" },
  { label: "Estado de pedido", href: "/estado-pedido" },
  { label: "Catálogo mayorista", href: "/catalogo?tipo=mayorista" },
  { label: "Admin", href: "/admin/login" },
];

function cleanHandle(handle: string) {
  return handle.replace("@", "").trim();
}

function getSocialUrl(type: "facebook" | "instagram" | "tiktok", handle: string) {
  const clean = cleanHandle(handle);

  if (!clean) {
    return "#";
  }

  if (type === "facebook") {
    return `https://www.facebook.com/${clean}`;
  }

  if (type === "instagram") {
    return `https://www.instagram.com/${clean}`;
  }

  return `https://www.tiktok.com/@${clean}`;
}

export default function SiteFooter() {
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    async function loadSettings() {
      const supabaseSettings = await getSupabaseStoreSettings();
      setSettings(supabaseSettings);
    }

    loadSettings();
  }, []);

  const whatsappUrl = useMemo(() => {
    return getWhatsappUrl(
      settings.whatsappMain,
      "Hola, vengo de la web de RCA IMPORT. Quisiera más información."
    );
  }, [settings.whatsappMain]);

  const socialLinks = [
    {
      label: "F",
      name: "Facebook",
      handle: settings.facebook,
      href: getSocialUrl("facebook", settings.facebook),
    },
    {
      label: "IG",
      name: "Instagram",
      handle: settings.instagram,
      href: getSocialUrl("instagram", settings.instagram),
    },
    {
      label: "TT",
      name: "TikTok",
      handle: settings.tiktok,
      href: getSocialUrl("tiktok", settings.tiktok),
    },
  ];

  return (
    <footer className="relative overflow-hidden border-t border-slate-200 bg-slate-950 text-white">
      <div className="absolute left-[-180px] top-[-180px] h-96 w-96 rounded-full bg-[#0057A8]/25 blur-3xl" />
      <div className="absolute bottom-[-220px] right-[-160px] h-[30rem] w-[30rem] rounded-full bg-[#E31B23]/20 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-12">
        <section className="mb-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-xl md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.45fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                <Sparkles size={16} />
                RCA IMPORT
              </div>

              <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
                Importaciones, tecnología y accesorios con atención personalizada.
              </h2>

              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-slate-300">
                Consulta stock, precios, envíos y compras al por mayor directamente
                con el equipo de RCA IMPORT.
              </p>
            </div>

            <div className="grid gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-6 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                <MessageCircle size={18} />
                Consultar por WhatsApp
                <ChevronRight
                  size={17}
                  className="transition group-hover:translate-x-0.5"
                />
              </a>

              <Link
                href="/catalogo"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-black text-slate-950 transition hover:bg-slate-100"
              >
                <PackageSearch size={18} />
                Ver catálogo
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[1.4rem] bg-white shadow-lg shadow-slate-950/20">
                <Image
                  src="/logo-rca.png"
                  alt="Logo RCA IMPORT"
                  fill
                  sizes="64px"
                  className="object-contain p-1.5"
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-2xl font-black">
                  {settings.storeName}
                </p>

                <p className="mt-1 truncate text-xs font-bold text-slate-400">
                  {settings.slogan}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm font-semibold leading-7 text-slate-300">
              Tienda de importaciones enfocada en productos tecnológicos,
              accesorios, equipos Apple y atención por WhatsApp.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  title={`${item.name}: ${item.handle}`}
                  className="group rounded-2xl border border-white/10 bg-white/10 p-3 text-center transition hover:border-[#0057A8] hover:bg-[#0057A8]"
                >
                  <p className="text-sm font-black text-white">{item.label}</p>

                  <p className="mt-1 truncate text-[10px] font-bold text-slate-300 group-hover:text-blue-100">
                    {item.handle || item.name}
                  </p>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <p className="flex items-center gap-2 font-black text-white">
              <PackageSearch size={19} className="text-blue-300" />
              Catálogo
            </p>

            <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-300">
              {catalogLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl px-3 py-2 transition hover:bg-white/10 hover:text-blue-200"
                >
                  {item.label}
                  <ChevronRight
                    size={15}
                    className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <p className="flex items-center gap-2 font-black text-white">
              <ShieldCheck size={19} className="text-blue-300" />
              Atención
            </p>

            <div className="mt-5 grid gap-3 text-sm font-semibold text-slate-300">
              {supportLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl px-3 py-2 transition hover:bg-white/10 hover:text-blue-200"
                >
                  {item.label}
                  <ChevronRight
                    size={15}
                    className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <p className="font-black text-white">Datos de tienda</p>

            <div className="mt-5 grid gap-4 text-sm font-semibold text-slate-300">
              <div className="flex gap-3 rounded-2xl bg-white/5 p-3">
                <MapPin className="shrink-0 text-blue-300" size={20} />
                <p className="leading-6">{settings.address}</p>
              </div>

              <div className="flex gap-3 rounded-2xl bg-white/5 p-3">
                <MessageCircle className="shrink-0 text-green-300" size={20} />
                <a
                  href={whatsappUrl}
                  target="_blank"
                  className="hover:text-blue-300"
                >
                  +51 {settings.whatsappMain}
                </a>
              </div>

              <div className="flex gap-3 rounded-2xl bg-white/5 p-3">
                <Mail className="shrink-0 text-blue-300" size={20} />
                <p className="break-all">{settings.adminEmail}</p>
              </div>

              <div className="flex gap-3 rounded-2xl bg-white/5 p-3">
                <Wallet className="shrink-0 text-purple-300" size={20} />
                <p className="leading-6">
                  Yape: {settings.yapeNumber}
                  <br />
                  <span className="text-slate-400">{settings.yapeOwner}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Truck,
              title: "Envíos a todo Perú",
              text: settings.shippingMessage,
            },
            {
              icon: BadgeCheck,
              title: "Pagos verificados",
              text: settings.paymentMessage,
            },
            {
              icon: PackageSearch,
              title: "Ventas al por mayor",
              text: settings.wholesaleMessage,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.7rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl"
            >
              <div className="flex gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-300">
                  <item.icon size={23} />
                </div>

                <div>
                  <p className="font-black text-white">{item.title}</p>

                  <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-slate-400">
                    {item.text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-white/10 pt-6 text-xs font-bold text-slate-400 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. Todos los
            derechos reservados.
          </p>

          <div className="flex flex-wrap gap-3">
            <span>Importaciones</span>
            <span className="text-slate-600">•</span>
            <span>Tecnología</span>
            <span className="text-slate-600">•</span>
            <span>Atención personalizada</span>
            <span className="text-slate-600">•</span>
            <a
              href={whatsappUrl}
              target="_blank"
              className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
            >
              WhatsApp
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}