"use client";

import AdminShell from "@/components/AdminShell";
import ConfirmModal from "@/components/ConfirmModal";
import { DEFAULT_STORE_SETTINGS, type StoreSettings } from "@/lib/store-settings";
import { supabase } from "@/lib/supabase";
import {
  getSupabaseStoreSettings,
  updateSupabaseStoreSettings,
} from "@/lib/supabase-settings";
import {
  BadgeCheck,
  Building2,
  CreditCard,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Share2,
  Truck,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  useEffect(() => {
    async function checkSessionAndLoad() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        localStorage.removeItem("rca_import_admin_session");
        router.push("/admin/login");
        return;
      }

      setReady(true);
      await loadSettings();
    }

    checkSessionAndLoad();
  }, [router]);

  async function loadSettings() {
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const settings = await getSupabaseStoreSettings();

    setForm({
      storeName: settings.storeName,
      slogan: settings.slogan,
      adminEmail: settings.adminEmail,
      whatsappMain: settings.whatsappMain,
      whatsappSecondary: settings.whatsappSecondary,
      yapeNumber: settings.yapeNumber,
      yapeOwner: settings.yapeOwner,
      address: settings.address,
      facebook: settings.facebook,
      instagram: settings.instagram,
      tiktok: settings.tiktok,
      shippingMessage: settings.shippingMessage,
      wholesaleMessage: settings.wholesaleMessage,
      paymentMessage: settings.paymentMessage,
    });

    setLoading(false);
  }

  function updateField(field: keyof StoreSettings, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSuccessMessage("");
    setErrorMessage("");

    if (!form.storeName.trim()) {
      setErrorMessage("Ingresa el nombre de la tienda.");
      return;
    }

    if (!form.whatsappMain.trim()) {
      setErrorMessage("Ingresa el WhatsApp principal.");
      return;
    }

    if (!form.yapeNumber.trim()) {
      setErrorMessage("Ingresa el número de Yape.");
      return;
    }

    setSaving(true);

    const result = await updateSupabaseStoreSettings({
      storeName: form.storeName.trim(),
      slogan: form.slogan.trim(),
      adminEmail: form.adminEmail.trim(),
      whatsappMain: form.whatsappMain.trim(),
      whatsappSecondary: form.whatsappSecondary.trim(),
      yapeNumber: form.yapeNumber.trim(),
      yapeOwner: form.yapeOwner.trim(),
      address: form.address.trim(),
      facebook: form.facebook.trim(),
      instagram: form.instagram.trim(),
      tiktok: form.tiktok.trim(),
      shippingMessage: form.shippingMessage.trim(),
      wholesaleMessage: form.wholesaleMessage.trim(),
      paymentMessage: form.paymentMessage.trim(),
    });

    setSaving(false);

    if (!result.success) {
      setErrorMessage("No se pudo guardar la configuración en Supabase.");
      return;
    }

    setSuccessMessage(
      "Configuración guardada correctamente. Los cambios ya se reflejan en la web pública."
    );
  }

  function restoreDefaults() {
    setForm(DEFAULT_STORE_SETTINGS);
    setRestoreModalOpen(false);
    setErrorMessage("");
    setSuccessMessage(
      "Valores base cargados. Presiona “Guardar cambios” para aplicarlos en Supabase."
    );
  }

  if (!ready) {
    return null;
  }

  return (
    <AdminShell
      title="Configuración"
      description="Administra los datos generales de RCA IMPORT conectados a Supabase."
    >
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard
          title="Tienda"
          value={form.storeName || "RCA IMPORT"}
          icon={Building2}
          color="text-[#0057A8]"
          bg="bg-blue-50"
        />

        <StatCard
          title="WhatsApp"
          value={form.whatsappMain || "Sin número"}
          icon={MessageCircle}
          color="text-green-700"
          bg="bg-green-50"
        />

        <StatCard
          title="Yape"
          value={form.yapeNumber || "Sin número"}
          icon={Wallet}
          color="text-purple-700"
          bg="bg-purple-50"
        />

        <StatCard
          title="Correo"
          value={form.adminEmail || "Sin correo"}
          icon={Mail}
          color="text-amber-700"
          bg="bg-amber-50"
        />

        <StatCard
          title="Redes"
          value="Activas"
          icon={Share2}
          color="text-[#E31B23]"
          bg="bg-red-50"
        />
      </section>

      {(successMessage || errorMessage) && (
        <section className="mt-6">
          {successMessage && (
            <div className="flex gap-3 rounded-2xl bg-green-50 p-5 text-sm font-bold text-green-700">
              <BadgeCheck className="shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="flex gap-3 rounded-2xl bg-red-50 p-5 text-sm font-bold text-[#E31B23]">
              <XCircle className="shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}
        </section>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.42fr]"
      >
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
            Datos principales
          </p>

          <h2 className="mt-3 text-3xl font-black">
            Información de la tienda
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Estos datos se usan en el footer, contacto, WhatsApp, Yape y páginas
            públicas.
          </p>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-[#f6f8fc] p-8 text-center">
              <RefreshCw
                className="mx-auto mb-4 animate-spin text-[#0057A8]"
                size={38}
              />

              <p className="font-black">Cargando configuración...</p>
            </div>
          ) : (
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <InputField
                label="Nombre de tienda *"
                value={form.storeName}
                onChange={(value) => updateField("storeName", value)}
                placeholder="RCA IMPORT"
                icon={Building2}
              />

              <InputField
                label="Slogan"
                value={form.slogan}
                onChange={(value) => updateField("slogan", value)}
                placeholder="Crea · Innova · Importa"
                icon={Settings}
              />

              <InputField
                label="Correo admin"
                value={form.adminEmail}
                onChange={(value) => updateField("adminEmail", value)}
                placeholder="rca.importperu@gmail.com"
                icon={Mail}
              />

              <InputField
                label="WhatsApp principal *"
                value={form.whatsappMain}
                onChange={(value) => updateField("whatsappMain", value)}
                placeholder="953447289"
                icon={MessageCircle}
              />

              <InputField
                label="WhatsApp secundario"
                value={form.whatsappSecondary}
                onChange={(value) => updateField("whatsappSecondary", value)}
                placeholder="932173126"
                icon={MessageCircle}
              />

              <InputField
                label="Número Yape *"
                value={form.yapeNumber}
                onChange={(value) => updateField("yapeNumber", value)}
                placeholder="953 447 289"
                icon={Wallet}
              />

              <InputField
                label="Titular Yape"
                value={form.yapeOwner}
                onChange={(value) => updateField("yapeOwner", value)}
                placeholder="Robert Edinzon Ccallo Aguilar"
                icon={CreditCard}
              />

              <div>
                <label className="text-sm font-black text-slate-700">
                  Dirección
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  rows={5}
                  placeholder="Dirección física de la tienda..."
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
                />
              </div>
            </div>
          )}
        </section>

        <aside className="grid h-fit gap-6">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Vista rápida
            </p>

            <div className="mt-5 rounded-[1.7rem] bg-[#f6f8fc] p-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8]">
                <Settings size={34} />
              </div>

              <h3 className="mt-5 text-3xl font-black">
                {form.storeName || "RCA IMPORT"}
              </h3>

              <p className="mt-2 text-sm font-bold text-slate-500">
                {form.slogan || "Crea · Innova · Importa"}
              </p>

              <div className="mt-5 grid gap-3">
                <PreviewLine icon={MessageCircle} text={form.whatsappMain} />
                <PreviewLine icon={Wallet} text={form.yapeNumber} />
                <PreviewLine icon={MapPin} text={form.address} />
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Acciones
            </p>

            <div className="mt-5 grid gap-3">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={18} />
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>

              <button
                type="button"
                onClick={loadSettings}
                disabled={loading || saving}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  className={loading ? "animate-spin" : ""}
                  size={17}
                />
                Recargar
              </button>

              <button
                type="button"
                onClick={() => setRestoreModalOpen(true)}
                disabled={saving || loading}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw size={17} />
                Restaurar base
              </button>
            </div>
          </section>
        </aside>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
            Redes sociales
          </p>

          <h2 className="mt-3 text-3xl font-black">Canales públicos</h2>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <InputField
              label="Facebook"
              value={form.facebook}
              onChange={(value) => updateField("facebook", value)}
              placeholder="RCAImportss"
              prefix="F"
              icon={Share2}
            />

            <InputField
              label="Instagram"
              value={form.instagram}
              onChange={(value) => updateField("instagram", value)}
              placeholder="rcaimportss"
              prefix="IG"
              icon={Share2}
            />

            <InputField
              label="TikTok"
              value={form.tiktok}
              onChange={(value) => updateField("tiktok", value)}
              placeholder="rca_import_peru"
              prefix="TT"
              icon={Share2}
            />
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
            Mensajes de tienda
          </p>

          <h2 className="mt-3 text-3xl font-black">
            Textos comerciales públicos
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Estos mensajes ayudan a explicar envíos, ventas mayoristas y pagos.
          </p>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            <TextareaField
              label="Mensaje de envíos"
              value={form.shippingMessage}
              onChange={(value) => updateField("shippingMessage", value)}
              icon={Truck}
            />

            <TextareaField
              label="Mensaje mayorista"
              value={form.wholesaleMessage}
              onChange={(value) => updateField("wholesaleMessage", value)}
              icon={Globe}
            />

            <TextareaField
              label="Mensaje de pagos"
              value={form.paymentMessage}
              onChange={(value) => updateField("paymentMessage", value)}
              icon={CreditCard}
            />
          </div>
        </section>

        <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-200 xl:col-span-2">
          <div className="grid gap-6 md:grid-cols-[1fr_0.35fr] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
                Configuración conectada
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Estos datos alimentan la web pública.
              </h2>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
                Al guardar, el Header, Footer, Contacto, WhatsApp, Yape y
                mensajes comerciales toman la información desde Supabase.
              </p>
            </div>

            <Settings className="text-blue-300" size={52} />
          </div>
        </section>
      </form>

      <ConfirmModal
        open={restoreModalOpen}
        title="Restaurar configuración base"
        description="Esto cargará los valores base de RCA IMPORT en el formulario. Luego deberás presionar “Guardar cambios” para aplicarlos en Supabase."
        confirmText="Restaurar"
        cancelText="Cancelar"
        loading={false}
        onCancel={() => setRestoreModalOpen(false)}
        onConfirm={restoreDefaults}
      />
    </AdminShell>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {title}
          </p>

          <p className="mt-2 truncate text-xl font-black text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}
        >
          <Icon className={color} size={24} />
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  icon: LucideIcon;
}) {
  return (
    <div>
      <label className="text-sm font-black text-slate-700">{label}</label>

      <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
        {prefix ? (
          <span className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-white px-2 text-xs font-black text-[#0057A8]">
            {prefix}
          </span>
        ) : (
          <Icon className="shrink-0 text-slate-400" size={20} />
        )}

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-full w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-black text-slate-700">
        <Icon size={18} className="text-[#0057A8]" />
        {label}
      </label>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={6}
        placeholder="Escribe el mensaje que verá el cliente..."
        className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
      />
    </div>
  );
}

function PreviewLine({
  icon: Icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white p-4">
      <Icon className="shrink-0 text-[#0057A8]" size={20} />

      <p className="line-clamp-2 text-sm font-bold text-slate-600">
        {text || "Sin dato"}
      </p>
    </div>
  );
}