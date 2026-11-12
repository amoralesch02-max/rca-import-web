"use client";

import { useChristmasState } from "@/components/navidad/ChristmasCountdown";
import Link from "next/link";

/**
 * Banner festivo del inicio (solo tema Navidad):
 *  - antes del 25: cuenta regresiva
 *  - el 25: "¡Feliz Navidad, Familia RCA IMPORT!"
 *  - después: saludo de fiestas
 */
export default function ChristmasBanner() {
  const state = useChristmasState();

  if (!state) {
    return null;
  }

  return (
    <section className="nv-only mx-auto max-w-7xl px-5 pt-6 md:px-6 md:pt-8">
      <div className="relative overflow-hidden rounded-3xl border border-amber-300/40 bg-slate-950 px-6 py-6 text-white shadow-lg shadow-slate-300/60 md:px-10 md:py-7">
        {/* Estrellas decorativas */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-5 top-3 text-sm text-amber-300/80"
        >
          ✦
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-8 top-5 text-xs text-amber-200/70"
        >
          ✦
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 left-1/3 text-xs text-white/40"
        >
          ✦
        </span>

        {state.phase === "before" && (
          <div className="relative flex flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
            <div className="flex flex-col items-center gap-4 md:flex-row md:gap-5">
              <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/10 ring-1 ring-amber-300/60">
                <span className="text-4xl font-bold leading-none">
                  {state.days}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-amber-200">
                  {state.days === 1 ? "día" : "días"}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  Cuenta regresiva
                </p>

                <h2 className="mt-1 text-xl font-bold md:text-2xl">
                  {state.days === 1
                    ? "¡Mañana es Navidad!"
                    : `Faltan ${state.days} días para Navidad`}
                </h2>

                <p className="mt-1 text-sm text-blue-100">
                  Encuentra el regalo ideal en tecnología.
                </p>
              </div>
            </div>

            <Link
              href="/catalogo"
              className="inline-flex shrink-0 items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand shadow-lg shadow-slate-950/20 transition hover:bg-blue-50"
            >
              Ver el catálogo
            </Link>
          </div>
        )}

        {state.phase === "today" && (
          <div className="relative text-center">
            <p className="text-3xl" aria-hidden="true">
              🎄 🎁 🎅
            </p>

            <h2 className="mt-3 text-2xl font-bold md:text-4xl">
              ¡Feliz Navidad, Familia RCA IMPORT!
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-blue-100 md:text-base">
              Gracias por confiar en nosotros. Que estas fiestas estén llenas
              de alegría y de unión.
            </p>
          </div>
        )}

        {state.phase === "after" && (
          <div className="relative text-center">
            <p className="text-3xl" aria-hidden="true">
              ✨ 🎁 ✨
            </p>

            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              ¡Felices fiestas, Familia RCA IMPORT!
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-blue-100 md:text-base">
              Les deseamos un próspero Año Nuevo.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
