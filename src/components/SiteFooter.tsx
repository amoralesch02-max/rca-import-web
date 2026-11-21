"use client";

import Image from "next/image";
import Link from "next/link";
import WhatsAppNudge from "@/components/WhatsAppNudge";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  BookOpen,
  Landmark,
  Mail,
  MapPin,
  Navigation,
  ShieldCheck,
  Smartphone,
  Truck,
  type LucideIcon,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { usePathname } from "next/navigation";
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
  { label: "Nosotros", href: "/nosotros" },
  { label: "Reseñas de clientes", href: "/nosotros#resenas" },
  { label: "Contacto", href: "/contacto" },
  { label: "Carrito", href: "/carrito" },
  { label: "Catálogo mayorista", href: "/catalogo?tipo=mayorista" },
];

/**
 * Lo que se busca en Google Maps para el mapa del pie de página.
 * Si el punto no queda exacto, cámbialo por el nombre del local tal como
 * aparece en Google Maps (o por sus coordenadas, ej. "-18.0146,-70.2536").
 */
const MAP_QUERY = "Centro Comercial Túpac Amaru, Tacna, Perú";

function TrustChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
      <Icon size={14} className="shrink-0 text-brand-soft" />
      {label}
    </span>
  );
}

function cleanHandle(handle: string) {
  return handle.replace("@", "").trim();
}

function getSocialUrl(
  type: "facebook" | "instagram" | "tiktok",
  handle: string
) {
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
  const pathname = usePathname();

  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [pageUrl, setPageUrl] = useState("");

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

  // Se guarda la página actual para que el mensaje diga desde dónde escribe el cliente
  useEffect(() => {
    setPageUrl(window.location.href);
  }, [pathname]);

  // Botón flotante: aparece en todas las páginas públicas
  const floatingWhatsappUrl = useMemo(() => {
    return getWhatsappUrl(
      settings.whatsappMain,
      pageUrl
        ? `Hola RCA IMPORT, vengo de su web (${pageUrl}). Quisiera hacer una consulta.`
        : "Hola RCA IMPORT, vengo de su web. Quisiera hacer una consulta."
    );
  }, [settings.whatsappMain, pageUrl]);

  const socialLinks = [
    {
      label: "Facebook",
      short: "F",
      href: getSocialUrl("facebook", settings.facebook),
    },
    {
      label: "Instagram",
      short: "IG",
      href: getSocialUrl("instagram", settings.instagram),
    },
    {
      label: "TikTok",
      short: "TT",
      href: getSocialUrl("tiktok", settings.tiktok),
    },
  ];

  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-white">
      <a
        href={floatingWhatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Escribir por WhatsApp"
        className="wa-wiggle fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-xl shadow-slate-950/30 transition hover:scale-105 hover:bg-green-600"
      >
        <span
          aria-hidden="true"
          className="wa-pulse pointer-events-none absolute inset-0 rounded-full bg-green-500"
        />
        <WhatsAppIcon size={26} className="relative" />
      </a>

      {/* Globito "¿Te ayudamos?" (una vez por visita) */}
      <WhatsAppNudge href={floatingWhatsappUrl} />

      <div className="mx-auto max-w-7xl px-5 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-white">
                <Image
                  src="/logo-rca.png"
                  alt="Logo RCA IMPORT"
                  fill
                  sizes="40px"
                  className="object-contain p-1"
                />
              </div>
              <p className="text-lg font-bold">{settings.storeName}</p>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
              {settings.slogan}. Tecnología importada, accesorios y ventas al
              por mayor con envíos a todo el Perú.
            </p>

            {/* Solo en Navidad */}
            <p className="nv-only mt-3 max-w-xs text-sm font-semibold text-amber-200">
              🎄 Felices fiestas de parte de toda la familia RCA IMPORT.
            </p>

            <div className="mt-5 flex gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-300 transition hover:border-brand hover:text-white"
                >
                  {social.short}
                </a>
              ))}
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Tienda
            </h4>
            <ul className="mt-4 grid gap-2.5">
              {catalogLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-300 transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Ayuda
            </h4>
            <ul className="mt-4 grid gap-2.5">
              {supportLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-300 transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Contacto
            </h4>
            <ul className="mt-4 grid gap-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <MapPin size={17} className="mt-0.5 shrink-0 text-brand-soft" />
                <span className="leading-6">{settings.address}</span>
              </li>
              <li className="flex gap-3">
                <WhatsAppIcon size={17} className="mt-0.5 shrink-0 text-green-400" />
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition hover:text-white"
                >
                  +51 {settings.whatsappMain}
                </a>
              </li>
              <li className="flex gap-3">
                <Mail size={17} className="mt-0.5 shrink-0 text-brand-soft" />
                <span className="break-all">{settings.adminEmail}</span>
              </li>
            </ul>

            {/* Mapa de la tienda (se carga solo cuando llega a la pantalla) */}
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <iframe
                title="Ubicación de la tienda en Google Maps"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&z=16&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block h-32 w-full border-0"
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-300 transition hover:text-white"
              >
                <Navigation size={13} />
                Cómo llegar
              </a>
            </div>

            {/* Obligatorio por ley (Indecopi): visible en toda la web */}
            <Link
              href="/libro-reclamaciones"
              className="mt-5 inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              <BookOpen size={18} className="shrink-0 text-brand-soft" />
              Libro de Reclamaciones
            </Link>
          </div>
        </div>

        {/* Métodos de pago y confianza */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-widest text-slate-500">
              Pagos
            </span>
            <TrustChip icon={Smartphone} label="Yape" />
            <TrustChip icon={Landmark} label="Transferencia bancaria" />
          </div>

          <div className="flex flex-wrap gap-2">
            <TrustChip icon={Truck} label="Envíos a todo el Perú" />
            <TrustChip icon={ShieldCheck} label="Compra segura" />
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-3 border-t border-white/10 pt-6 text-xs text-slate-500 md:flex-row md:items-center">
          <p>
            © {new Date().getFullYear()} {settings.storeName}. Todos los
            derechos reservados.
          </p>

          <Link
            href="/admin/login"
            className="text-slate-600 transition hover:text-slate-300"
          >
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
