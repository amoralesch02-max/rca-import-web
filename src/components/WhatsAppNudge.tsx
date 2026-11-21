"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

const SEEN_KEY = "rca_wa_nudge_seen";
const SHOW_AFTER = 4000; // ms después de abrir la página
const VISIBLE_FOR = 7000; // ms que queda a la vista

/**
 * Globito "¿Te ayudamos?" junto al botón flotante de WhatsApp.
 * Aparece una sola vez por visita (no en cada página) y se va solo.
 * Tocarlo abre WhatsApp; la X lo cierra.
 */
export default function WhatsAppNudge({ href }: { href: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let alreadySeen = false;

    try {
      alreadySeen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Navegación privada o almacenamiento bloqueado: se muestra igual
    }

    if (alreadySeen) {
      return;
    }

    let hideTimer = 0;

    const showTimer = window.setTimeout(() => {
      setVisible(true);

      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Sin almacenamiento: no pasa nada
      }

      hideTimer = window.setTimeout(() => setVisible(false), VISIBLE_FOR);
    }, SHOW_AFTER);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed bottom-[22px] right-[88px] z-50 origin-right transition duration-300 ease-out ${
        visible
          ? "translate-x-0 scale-100 opacity-100"
          : "pointer-events-none translate-x-2 scale-95 opacity-0"
      }`}
    >
      <div className="relative flex items-center rounded-2xl bg-white py-2.5 pl-4 pr-9 text-slate-950 shadow-xl shadow-slate-950/20 ring-1 ring-slate-200">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          tabIndex={visible ? 0 : -1}
          onClick={() => setVisible(false)}
          className="block whitespace-nowrap"
        >
          <span className="block text-sm font-bold">¿Te ayudamos? 👋</span>
          <span className="block text-xs text-slate-500">
            Escríbenos por WhatsApp
          </span>
        </a>

        <button
          type="button"
          onClick={() => setVisible(false)}
          tabIndex={visible ? 0 : -1}
          aria-label="Cerrar mensaje"
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={14} />
        </button>

        {/* Piquito que apunta al botón */}
        <span
          aria-hidden="true"
          className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 bg-white ring-1 ring-slate-200 [clip-path:polygon(0_0,100%_0,100%_100%)]"
        />
      </div>
    </div>
  );
}
