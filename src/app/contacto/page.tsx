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
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  Send,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { type ComponentType, useEffect, useMemo, useState } from "react";

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

  const learnImportUrl = useMemo(() => {
    return getWhatsappUrl(
      settings.whatsappMain,
      "Hola, estoy interesado en aprender a importar con RCA IMPORT. ¿Podrías brindarme más información?"
    );
  }, [settings.whatsappMain]);

  const mapsUrl = useMemo(() => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      settings.address
    )}`;
  }, [settings.address]);

  const socialLinks = [
    {
      name: "Facebook",
      handle: settings.facebook,
      href: getSocialUrl("facebook", settings.facebook),
    },
    {
      name: "Instagram",
      handle: settings.instagram,
      href: getSocialUrl("instagram", settings.instagram),
    },
    {
      name: "TikTok",
      handle: settings.tiktok,
      href: getSocialUrl("tiktok", settings.tiktok),
    },
  ].filter((item) => cleanHandle(item.handle));

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
    <main className="min-h-screen bg-bg text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-5 py-12 md:px-6 md:py-16">
        {/* Título */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Contáctanos
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Atención directa por WhatsApp para compras, envíos y
            consultas por mayor.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* ============ Datos de contacto ============ */}
          <div className="grid gap-4">
            <InfoCard icon={WhatsAppIcon} title="WhatsApp / Teléfono">
              <a
                href={whatsappMainUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-sm text-slate-600 transition hover:text-brand"
              >
                Principal: +51 {settings.whatsappMain}
              </a>

              {settings.whatsappSecondary && (
                <a
                  href={whatsappSecondaryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-sm text-slate-600 transition hover:text-brand"
                >
                  Secundario: +51 {settings.whatsappSecondary}
                </a>
              )}
            </InfoCard>

            <InfoCard icon={Mail} title="Correo electrónico">
              <p className="break-all text-sm text-slate-600">
                {settings.adminEmail}
              </p>
            </InfoCard>

            <InfoCard icon={Wallet} title="Yape">
              <p className="text-sm text-slate-600">
                Número: {settings.yapeNumber}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Titular: {settings.yapeOwner}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <MiniButton onClick={() => copyText("yape", settings.yapeNumber)}>
                  <Copy size={13} />
                  {copied === "yape" ? "Número copiado" : "Copiar número"}
                </MiniButton>

                <MiniButton onClick={() => copyText("owner", settings.yapeOwner)}>
                  <Copy size={13} />
                  {copied === "owner" ? "Titular copiado" : "Copiar titular"}
                </MiniButton>
              </div>
            </InfoCard>

            {socialLinks.length > 0 && (
              <InfoCard icon={AtSign} title="Redes sociales">
                <div className="grid gap-1">
                  {socialLinks.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-slate-600 transition hover:text-brand"
                    >
                      {item.name}: {item.handle}
                    </a>
                  ))}
                </div>
              </InfoCard>
            )}

            <InfoCard icon={MapPin} title="Dirección">
              <p className="text-sm leading-6 text-slate-600">
                {settings.address}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
                >
                  Abrir en Google Maps
                  <ExternalLink size={13} />
                </a>

                <MiniButton
                  onClick={() => copyText("address", settings.address)}
                >
                  <Copy size={13} />
                  {copied === "address" ? "Copiada" : "Copiar"}
                </MiniButton>
              </div>
            </InfoCard>
          </div>

          {/* ============ Formulario ============ */}
          <div className="rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-28">
            <h2 className="text-lg font-semibold">Escríbenos por WhatsApp</h2>

            <p className="mt-1 text-sm text-slate-500">
              Completa tus datos y se abrirá WhatsApp con el mensaje listo para
              enviar.
            </p>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Tu nombre
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  placeholder="Ej: Alisson Morales"
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-bg px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  Tu celular
                </label>

                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  inputMode="tel"
                  placeholder="Ej: 999 999 999"
                  className="mt-1.5 h-11 w-full rounded-xl border border-line bg-bg px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  Mensaje
                </label>

                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm({ ...form, message: event.target.value })
                  }
                  rows={5}
                  placeholder="Ej: Hola, quisiera consultar por un producto disponible."
                  className="mt-1.5 w-full resize-none rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white"
                />
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-green-500 px-6 text-sm font-semibold text-white shadow-lg shadow-green-200 transition hover:bg-green-600"
              >
                <Send size={17} />
                Enviar por WhatsApp
              </a>
            </div>

            <div className="mt-5 flex gap-3 rounded-xl bg-blue-50 p-4">
              <ShieldCheck className="mt-0.5 shrink-0 text-brand" size={18} />

              <p className="text-xs leading-5 text-slate-600">
                La atención es personalizada. Puedes consultar stock,
                compatibilidad, precios por mayor o
                coordinación de envíos.
              </p>
            </div>

          </div>
        </div>

        {/* ============ Aprende a importar ============ */}
        <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-3xl bg-slate-950 p-8 text-white md:flex-row md:items-center md:p-10">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Aprende con RCA IMPORT
            </p>

            <h2 className="mt-2 text-2xl font-bold md:text-3xl">
              ¿Te interesa importar? Aprende conmigo.
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Resuelve dudas sobre proveedores, compras, envíos y procesos
              básicos para empezar con más seguridad.
            </p>
          </div>

          <a
            href={learnImportUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-alert px-6 py-3 text-sm font-semibold text-white transition hover:bg-alert-hover"
          >
            <WhatsAppIcon size={17} />
            Quiero aprender a importar
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-2xl border border-line bg-white p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{title}</p>

        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}

function MiniButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand hover:text-brand"
    >
      {children}
    </button>
  );
}
