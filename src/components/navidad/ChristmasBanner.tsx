"use client";

import { useChristmasState } from "@/components/navidad/ChristmasCountdown";
import GiftElf from "@/components/navidad/GiftElf";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getWhatsappUrl } from "@/lib/store-settings";
import { useStoreSettings } from "@/lib/use-store-settings";
import { ChevronRight, Gift } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";

/**
 * Banner festivo del inicio (solo tema Navidad):
 *  - antes del 25: cuenta regresiva en vivo (días, horas, minutos, segundos)
 *  - el 25: "¡Feliz Navidad, Familia RCA IMPORT!"
 *  - después: saludo de fiestas
 * Las animaciones (.nv-banner …) están en temas/navidad.css.
 */

type Remaining = { days: number; hours: number; minutes: number; seconds: number };

function getRemaining(now: Date): Remaining {
  const christmas = new Date(now.getFullYear(), 11, 25);
  const total = Math.max(0, Math.floor((christmas.getTime() - now.getTime()) / 1000));

  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/** Reloj de la cuenta regresiva: se actualiza cada segundo solo mientras se ve. */
function useRemaining(active: boolean) {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const update = () => setRemaining(getRemaining(new Date()));
    update();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        update();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [active]);

  return remaining;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Bombillas de la guirnalda (posición en %, color y ritmo de cada una) */
const BULBS = Array.from({ length: 16 }, (_, index) => ({
  x: 3 + index * 6.25,
  color: ["#f6c244", "#e5384f", "#5ee0a0", "#7cc4ff"][index % 4],
  duration: 1.6 + (index % 5) * 0.35,
  delay: (index % 7) * 0.3,
}));

function anim(duration: number, delay: number) {
  return { "--nv-d": `${duration}s`, "--nv-s": `${delay}s` } as CSSProperties;
}

function Garland() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-0 h-6 w-full md:h-7"
    >
      <path
        d="M0 2 Q 6.25 7 12.5 2 T 25 2 T 37.5 2 T 50 2 T 62.5 2 T 75 2 T 87.5 2 T 100 2"
        fill="none"
        stroke="#334155"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Bulbs() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-7">
      {BULBS.map((bulb) => (
        <span
          key={bulb.x}
          className="nv-bulb absolute top-[7px] h-2.5 w-1.5 -translate-x-1/2 rounded-b-full md:top-2 md:h-3 md:w-2"
          style={{
            left: `${bulb.x}%`,
            backgroundColor: bulb.color,
            boxShadow: `0 0 10px 2px ${bulb.color}`,
            ...anim(bulb.duration, bulb.delay),
          }}
        />
      ))}
    </div>
  );
}

function Ornament({
  className,
  color,
  shine,
  cord,
  duration,
}: {
  className: string;
  color: string;
  shine: string;
  cord: number;
  duration: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 40 ${cord + 44}`}
      className={`nv-banner-swing pointer-events-none absolute top-0 ${className}`}
      style={anim(duration, 0)}
    >
      <line x1="20" y1="0" x2="20" y2={cord} stroke="#cbd5e1" strokeOpacity=".5" strokeWidth="1" />
      <rect x="15" y={cord} width="10" height="6" rx="1.5" fill="#d4b36a" />
      <circle cx="20" cy={cord + 22} r="16" fill={color} />
      <circle cx="20" cy={cord + 22} r="16" fill="url(#nvBannerShade)" />
      <ellipse cx="14" cy={cord + 15} rx="4.5" ry="3" fill={shine} opacity=".55" />
    </svg>
  );
}

function TimeTile({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-16 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur-sm sm:h-20 sm:w-[4.5rem] md:h-24 md:w-20">
        {/* Línea media, como un reloj de tarjetas */}
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-slate-950/40" />
        <span
          key={value}
          className="nv-tick relative text-3xl font-extrabold tabular-nums text-amber-200 sm:text-4xl md:text-5xl"
        >
          {value}
        </span>
      </div>
      <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-100/80 sm:text-[11px]">
        {label}
      </span>
    </div>
  );
}

export default function ChristmasBanner() {
  const state = useChristmasState();
  const settings = useStoreSettings();
  const remaining = useRemaining(state?.phase === "before");

  if (!state) {
    return null;
  }

  const giftUrl = getWhatsappUrl(
    settings.whatsappMain,
    "Hola RCA IMPORT, busco un regalo para Navidad. ¿Me ayudan a elegir?"
  );

  return (
    <section className="nv-only mx-auto max-w-7xl px-5 pt-6 md:px-6 md:pt-8">
      <div className="nv-banner relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#071a3d_0%,#0b2f6b_55%,#0a3f86_100%)] px-6 pb-14 pt-12 text-white shadow-xl shadow-slate-300/60 ring-1 ring-amber-300/30 md:px-10 md:pb-16 md:pt-14">
        {/* Degradado de sombra para las esferas */}
        <svg aria-hidden="true" width="0" height="0" className="absolute">
          <defs>
            <radialGradient id="nvBannerShade" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity=".25" />
              <stop offset="70%" stopColor="#000000" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity=".35" />
            </radialGradient>
          </defs>
        </svg>

        {/* Fondo: estrellas, brillo cálido y nieve abajo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[url('/navidad/estrellas.png')] bg-[length:420px] opacity-60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-300/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl"
        />
        <img
          src="/navidad/nieve.webp"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full object-cover object-top opacity-90 md:h-14"
        />

        <Garland />
        <Bulbs />

        {/* Esferas colgando (solo en pantallas medianas o más) */}
        <Ornament className="right-[30%] hidden w-7 md:block" color="#d4192d" shine="#ffd5d5" cord={34} duration={4.4} />
        <Ornament className="right-[24%] hidden w-6 md:block" color="#e0b04a" shine="#fff4d0" cord={58} duration={5.2} />
        <Ornament className="left-[46%] hidden w-5 lg:block" color="#2f8f5b" shine="#d7ffe8" cord={22} duration={4.8} />

        {state.phase === "before" && (
          // Celular: texto → contador → botones (uno debajo de otro).
          // Escritorio: texto y botones a la izquierda, contador al centro, pingüino a la derecha.
          <div className="relative grid items-center gap-x-10 gap-y-7 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:[grid-template-areas:'text_timer_elf'_'cta_timer_elf']">
            <div className="text-center lg:text-left lg:[grid-area:text]">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300 ring-1 ring-amber-300/30">
                <Gift size={13} />
                Cuenta regresiva
              </p>

              <h2 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl md:text-4xl">
                {state.days <= 1 ? (
                  <>¡Mañana es <span className="text-amber-300">Navidad</span>!</>
                ) : (
                  <>
                    La <span className="text-amber-300">Navidad</span> ya está cerca
                  </>
                )}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-blue-100 md:text-base lg:mx-0">
                Encuentra el regalo ideal en tecnología y recíbelo a tiempo en
                cualquier parte del Perú.
              </p>
            </div>

            {/* Contador en vivo */}
            <div
              className="flex items-start justify-center gap-2 sm:gap-3 lg:[grid-area:timer]"
              role="timer"
              aria-label={`Faltan ${remaining?.days ?? state.days} días para Navidad`}
            >
              <TimeTile value={remaining ? String(remaining.days) : String(state.days)} label="Días" />
              <span aria-hidden="true" className="pt-4 text-2xl font-bold text-white/30 sm:pt-5 md:pt-7">:</span>
              <TimeTile value={remaining ? pad(remaining.hours) : "--"} label="Horas" />
              <span aria-hidden="true" className="pt-4 text-2xl font-bold text-white/30 sm:pt-5 md:pt-7">:</span>
              <TimeTile value={remaining ? pad(remaining.minutes) : "--"} label="Min" />
              <span aria-hidden="true" className="pt-4 text-2xl font-bold text-white/30 sm:pt-5 md:pt-7">:</span>
              <TimeTile value={remaining ? pad(remaining.seconds) : "--"} label="Seg" />
            </div>

            <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start lg:self-start lg:[grid-area:cta]">
              <Link
                href="/catalogo"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-brand shadow-lg shadow-slate-950/30 transition hover:bg-blue-50"
              >
                Ver regalos
                <ChevronRight size={16} />
              </Link>

              <a
                href={giftUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-6 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/15"
              >
                <WhatsAppIcon size={16} />
                Te ayudamos a elegir
              </a>
            </div>

            {/* Pingüino con su regalo (solo pantallas grandes) */}
            <div aria-hidden="true" className="relative hidden lg:block lg:[grid-area:elf]">
              <div className="absolute inset-0 m-auto h-40 w-40 rounded-full bg-amber-200/20 blur-2xl" />
              <GiftElf className="relative w-36 xl:w-44" />
            </div>
          </div>
        )}

        {state.phase === "today" && (
          <div className="relative text-center">
            <GiftElf className="mx-auto w-24 md:w-28" />

            <h2 className="mt-4 text-2xl font-extrabold tracking-tight md:text-4xl">
              ¡Feliz <span className="text-amber-300">Navidad</span>, Familia RCA IMPORT!
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-blue-100 md:text-base">
              Gracias por confiar en nosotros. Que estas fiestas estén llenas
              de alegría y de unión.
            </p>
          </div>
        )}

        {state.phase === "after" && (
          <div className="relative text-center">
            <GiftElf className="mx-auto w-24 md:w-28" />

            <h2 className="mt-4 text-2xl font-extrabold tracking-tight md:text-3xl">
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
