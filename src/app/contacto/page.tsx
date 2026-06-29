"use client";

import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  AtSign,
  BadgeCheck,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  PhoneCall,
  Send,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

export default function ContactPage() {
  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const [copied, setCopied] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    message: "",
  });

  useEffect(() => {
    async function loadSettings() {
      const supabaseSettings = await getSupabaseStoreSettings();
      setSettings(supabaseSettings);
    }

    loadSettings();
  }, []);

  const whatsappMessage = useMemo(() => {
    const nameText = form.name.trim()
      ? `Mi nombre es ${form.name.trim()}.`
      : "Vengo desde la web de RCA IMPORT.";

    const phoneText = form.phone.trim()
      ? `Mi número es ${form.phone.trim()}.`
      : "";

    const messageText = form.message.trim()
      ? form.message.trim()
      : "Quisiera consultar stock, precios y disponibilidad.";

    return `${nameText} ${phoneText} ${messageText}`;
  }, [form]);

  const whatsappUrl = useMemo(() => {
    return getWhatsappUrl(settings.whatsappMain, whatsappMessage);
  }, [settings.whatsappMain, whatsappMessage]);

  const whatsappMainUrl = useMemo(() => {
    return getWhatsappUrl(
      settings.whatsappMain,
      "Hola, vengo de la web de RCA IMPORT. Quisiera consultar stock y precios."
    );
  }, [settings.whatsappMain]);

  const whatsappSecondaryUrl = useMemo(() => {
    return getWhatsappUrl(
      settings.whatsappSecondary,
      "Hola, vengo de la web de RCA IMPORT. Quisiera más información."
    );
  }, [settings.whatsappSecondary]);

  const mapsUrl = useMemo(() => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      settings.address
    )}`;
  }, [settings.address]);

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

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);

      setTimeout(() => {
        setCopied("");
      }, 1800);
    } catch {
      setCopied("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition hover:text-[#0057A8]"
          >
            <Home size={15} />
            Inicio
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <span className="text-slate-950">Contacto</span>
        </div>

        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300 md:p-12">
          <div className="absolute right-[-150px] top-[-170px] h-96 w-96 rounded-full bg-[#0057A8]/30 blur-3xl" />
          <div className="absolute bottom-[-200px] left-[-130px] h-96 w-96 rounded-full bg-[#E31B23]/25 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                <MessageCircle size={16} />
                Contacto RCA IMPORT
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Atención directa para compras, separaciones y consultas.
              </h1>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-300 md:text-base">
                Escríbenos para consultar stock, precios, envíos, productos al
                por mayor o disponibilidad de productos importados.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href={whatsappMainUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700"
                >
                  <MessageCircle size={18} />
                  WhatsApp principal
                </a>

                <a
                  href={whatsappSecondaryUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <Smartphone size={18} />
                  WhatsApp secundario
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <HeroStat title="WhatsApp" value={`+51 ${settings.whatsappMain}`} />
              <HeroStat title="Yape" value={settings.yapeNumber} />
              <HeroStat title="Envíos" value="Todo Perú" large />
              <HeroStat title="Atención" value="Manual" />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.78fr_1fr]">
          <aside className="grid h-fit gap-5 lg:sticky lg:top-32">
            <ContactCard
              icon={MapPin}
              eyebrow="Dirección"
              title="Visítanos"
              description={settings.address}
              actionLabel="Abrir en Google Maps"
              actionHref={mapsUrl}
              secondaryAction={() => copyText("address", settings.address)}
              secondaryLabel={copied === "address" ? "Copiado" : "Copiar"}
            />

            <ContactCard
              icon={MessageCircle}
              eyebrow="WhatsApp"
              title="Atención rápida"
              description={`Principal: +51 ${settings.whatsappMain}\nSecundario: +51 ${settings.whatsappSecondary}`}
              actionLabel="Escribir al principal"
              actionHref={whatsappMainUrl}
              secondaryHref={whatsappSecondaryUrl}
              secondaryLabel="Escribir al secundario"
            />

            <ContactCard
              icon={Wallet}
              eyebrow="Pago manual"
              title="Yape"
              description={`Número: ${settings.yapeNumber}\nTitular: ${settings.yapeOwner}`}
              actionLabel={copied === "yape" ? "Número copiado" : "Copiar Yape"}
              actionButton={() => copyText("yape", settings.yapeNumber)}
              secondaryAction={() => copyText("owner", settings.yapeOwner)}
              secondaryLabel={copied === "owner" ? "Titular copiado" : "Copiar titular"}
            />
          </aside>

          <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6 md:p-8">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Escríbenos
              </p>

              <h2 className="mt-3 text-4xl font-black">
                Envía tu consulta por WhatsApp
              </h2>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">
                Completa estos datos y se abrirá WhatsApp con un mensaje listo
                para enviar a RCA IMPORT.
              </p>
            </div>

            <div className="p-6 md:p-8">
              <div className="grid gap-4">
                <FieldBlock label="Nombre" icon={UserRound}>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="Ejemplo: Alisson Morales"
                    className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                  />
                </FieldBlock>

                <FieldBlock label="Celular" icon={PhoneCall}>
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                    placeholder="Ejemplo: 999 999 999"
                    className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                  />
                </FieldBlock>

                <div>
                  <label className="text-sm font-black text-slate-700">
                    Mensaje
                  </label>

                  <div className="mt-2 flex gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
                    <MessageCircle
                      className="mt-1 shrink-0 text-slate-400"
                      size={19}
                    />

                    <textarea
                      value={form.message}
                      onChange={(event) =>
                        setForm({ ...form, message: event.target.value })
                      }
                      placeholder="Ejemplo: Hola, quisiera consultar por un iPhone disponible."
                      rows={6}
                      className="w-full resize-none bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700"
                >
                  <Send size={18} />
                  Enviar por WhatsApp
                </a>
              </div>

              <div className="mt-6 rounded-[1.7rem] bg-blue-50 p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="shrink-0 text-[#0057A8]" />

                  <p className="text-sm font-semibold leading-6 text-slate-600">
                    La atención se realiza de forma personalizada. Puedes
                    consultar stock, compatibilidad, estado de reserva, precios
                    por mayor o coordinación de envíos.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={Clock3}
            title="Atención personalizada"
            text="Coordinación directa por WhatsApp para confirmar stock, precios y disponibilidad."
          />

          <FeatureCard
            icon={Truck}
            title="Envíos a todo Perú"
            text={settings.shippingMessage}
          />

          <FeatureCard
            icon={BadgeCheck}
            title="Pagos verificados"
            text={settings.paymentMessage}
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Redes sociales
              </p>

              <h2 className="mt-3 text-3xl font-black">
                También puedes encontrarnos aquí
              </h2>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-3">
              {socialLinks.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  className="group rounded-[1.7rem] border border-slate-200 bg-[#f6f8fc] p-5 transition hover:-translate-y-0.5 hover:border-[#0057A8] hover:bg-blue-50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white transition group-hover:bg-[#0057A8]">
                    {item.label}
                  </div>

                  <p className="mt-4 font-black">{item.name}</p>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                    {item.handle || "RCA IMPORT"}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[#0057A8]">
                    Abrir red
                    <ExternalLink size={13} />
                  </span>
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-200">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
              Catálogo
            </p>

            <h2 className="mt-3 text-4xl font-black leading-tight">
              Revisa productos antes de consultar.
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
              Puedes elegir un producto del catálogo y luego consultar stock,
              separación, envío o precio mayorista por WhatsApp.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                href="/catalogo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
              >
                <ShoppingBag size={18} />
                Ver catálogo
              </Link>

              <Link
                href="/estado-pedido"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white transition hover:bg-blue-700"
              >
                <PackageSearch size={18} />
                Consultar estado
              </Link>
            </div>
          </section>
        </section>

        <section className="mt-8 rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-6 md:grid-cols-[0.45fr_1fr] md:items-center">
            <div className="rounded-[2rem] bg-slate-950 p-6 text-white">
              <MapPin className="text-blue-300" size={42} />

              <h2 className="mt-5 text-3xl font-black">Ubicación RCA IMPORT</h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-300">
                Puedes abrir la dirección en Google Maps para ubicar la tienda
                con mayor facilidad.
              </p>

              <a
                href={mapsUrl}
                target="_blank"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100"
              >
                Abrir mapa
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="rounded-[2rem] bg-[#f6f8fc] p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Dirección registrada
              </p>

              <p className="mt-3 text-xl font-black leading-8 text-slate-950">
                {settings.address}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => copyText("address-bottom", settings.address)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:text-[#0057A8]"
                >
                  <Copy size={16} />
                  {copied === "address-bottom" ? "Dirección copiada" : "Copiar dirección"}
                </button>

                <a
                  href={whatsappMainUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700"
                >
                  <MessageCircle size={16} />
                  Consultar referencia
                </a>
              </div>
            </div>
          </div>
        </section>
      </section>

      <SiteFooter />
    </main>
  );
}

function HeroStat({
  title,
  value,
  large = false,
}: {
  title: string;
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

      <p className="mt-4 truncate text-2xl font-black">{value}</p>

      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
        {title}
      </p>
    </div>
  );
}

function ContactCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  actionLabel,
  actionHref,
  actionButton,
  secondaryLabel,
  secondaryHref,
  secondaryAction,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref?: string;
  actionButton?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  secondaryAction?: () => void;
}) {
  return (
    <div className="rounded-[2.2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8]">
        <Icon size={28} />
      </div>

      <p className="mt-5 text-sm font-black uppercase tracking-[0.22em] text-[#E31B23]">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-2xl font-black">{title}</h2>

      <div className="mt-3 space-y-1">
        {description.split("\n").map((line) => (
          <p
            key={line}
            className="text-sm font-semibold leading-7 text-slate-500"
          >
            {line}
          </p>
        ))}
      </div>

      <div className="mt-5 grid gap-2">
        {actionHref ? (
          <a
            href={actionHref}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
          >
            {actionLabel}
            <ExternalLink size={15} />
          </a>
        ) : (
          <button
            type="button"
            onClick={actionButton}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
          >
            {actionLabel}
            <Copy size={15} />
          </button>
        )}

        {secondaryLabel &&
          (secondaryHref ? (
            <a
              href={secondaryHref}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              {secondaryLabel}
              <ExternalLink size={15} />
            </a>
          ) : (
            <button
              type="button"
              onClick={secondaryAction}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              {secondaryLabel}
              <Copy size={15} />
            </button>
          ))}
      </div>
    </div>
  );
}

function FieldBlock({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-black text-slate-700">{label}</label>

      <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
        <Icon className="shrink-0 text-slate-400" size={19} />
        {children}
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8]">
        <Icon size={25} />
      </div>

      <h3 className="mt-4 text-xl font-black">{title}</h3>

      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {text}
      </p>
    </div>
  );
}