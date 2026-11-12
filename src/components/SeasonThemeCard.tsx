"use client";

import {
  SEASON_THEME_LABELS,
  type SeasonTheme,
} from "@/lib/store-settings";
import {
  getSupabaseStoreSettings,
  updateSupabaseSeasonTheme,
} from "@/lib/supabase-settings";
import { AlertCircle, CheckCircle2, Eye, Snowflake } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Tarjeta del panel admin (Configuración) para cambiar el tema de temporada.
 * Guarda de inmediato y solo ese valor: no depende del resto del formulario.
 */

const options: {
  value: SeasonTheme;
  title: string;
  text: string;
  disabled?: boolean;
}[] = [
  {
    value: "normal",
    title: "Normal",
    text: "El diseño habitual de la tienda.",
  },
  {
    value: "navidad",
    title: "Navidad",
    text: "Noche de invierno: azul marino, estrellas y detalles dorados.",
  },
  {
    value: "anio-nuevo",
    title: "Año Nuevo",
    text: "Próximamente.",
    disabled: true,
  },
];

export default function SeasonThemeCard() {
  const [saved, setSaved] = useState<SeasonTheme>("normal");
  const [selected, setSelected] = useState<SeasonTheme>("normal");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const settings = await getSupabaseStoreSettings();
      const theme = settings.seasonTheme ?? "normal";

      setSaved(theme);
      setSelected(theme);
      setLoaded(true);
    }

    load();
  }, []);

  async function applyTheme() {
    setSaving(true);
    setMessage("");
    setError("");

    const result = await updateSupabaseSeasonTheme(selected);

    setSaving(false);

    if (!result.success) {
      const text = result.error ?? "No se pudo cambiar el tema.";

      setError(
        /season_theme|column|schema/i.test(text)
          ? "Falta ejecutar el SQL del tema en Supabase (archivo supabase-tema.sql). Hazlo una vez y vuelve a intentar."
          : text
      );

      return;
    }

    setSaved(selected);
    setMessage(
      selected === "normal"
        ? "Listo: la tienda volvió al diseño normal."
        : `Listo: el tema ${SEASON_THEME_LABELS[selected]} ya está activo en la tienda.`
    );
  }

  const changed = selected !== saved;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8]">
            <Snowflake size={28} />
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Tema de temporada
            </p>

            <h2 className="mt-1 text-2xl font-black">Apariencia de la tienda</h2>
          </div>
        </div>

        {loaded && (
          <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-[#0057A8]">
            En la tienda ahora: {SEASON_THEME_LABELS[saved]}
          </span>
        )}
      </div>

      <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
        Cambia el aspecto de la tienda para tus clientes. Puedes preparar el
        tema y verlo en privado antes de activarlo: la vista previa solo la ves
        tú, en esa pestaña.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          const active = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={option.disabled || !loaded}
              onClick={() => setSelected(option.value)}
              className={`rounded-[1.5rem] border p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? "border-[#0057A8] bg-blue-50 ring-2 ring-[#0057A8]/20"
                  : "border-slate-200 bg-[#f6f8fc] hover:border-[#0057A8]"
              }`}
            >
              <p className="text-base font-black">{option.title}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                {option.text}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-5 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-[#E31B23]">
          <AlertCircle className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div className="mt-5 flex gap-3 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
          <CheckCircle2 className="shrink-0" />
          <p>{message}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={applyTheme}
          disabled={!changed || saving || !loaded}
          className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Aplicando..."
            : selected === "normal"
            ? "Volver al diseño normal"
            : `Activar ${SEASON_THEME_LABELS[selected]} en la tienda`}
        </button>

        {selected !== "normal" && (
          <a
            href={`/?tema=${selected}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 transition hover:border-[#0057A8] hover:text-[#0057A8]"
          >
            <Eye size={17} />
            Ver vista previa privada
          </a>
        )}
      </div>

      <p className="mt-4 text-xs font-semibold leading-6 text-slate-400">
        Los visitantes verán el cambio al recargar la tienda. La vista previa no
        modifica lo que ve el público.
      </p>
    </section>
  );
}
