"use client";

import Link from "next/link";
import { CalendarDays, MapPin, PackageCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getSupabaseDeliveries,
  type PublicDelivery,
} from "@/lib/supabase-deliveries";

function formatDate(date: string) {
  if (!date) {
    return "Fecha reciente";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function CustomerDeliveriesSection() {
  const [deliveries, setDeliveries] = useState<PublicDelivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDeliveries() {
      const supabaseDeliveries = await getSupabaseDeliveries();

      setDeliveries(supabaseDeliveries.slice(0, 3));
      setLoading(false);
    }

    loadDeliveries();
  }, []);

  if (loading || deliveries.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-line bg-white py-14 text-slate-950">
      <div className="mx-auto max-w-7xl px-5 md:px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-alert">
            Clientes felices
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Historias reales, entregas verificadas
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            Cada pedido se coordina con atención personalizada y
            verificación del producto. Estas son algunas de las compras
            entregadas a nuestros clientes.
          </p>

          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            <li>✓ Entrega verificada</li>
            <li>✓ Atención directa</li>
            <li>✓ Envíos a todo el Perú</li>
          </ul>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {deliveries.map((delivery) => (
            <article
              key={delivery.id}
              className="group overflow-hidden rounded-2xl border border-line bg-bg transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-xl hover:shadow-slate-200"
            >
              <div className="relative h-64 overflow-hidden bg-surface-2">
                {delivery.imageUrl ? (
                  <img
                    src={delivery.imageUrl}
                    alt={delivery.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <PackageCheck className="text-slate-300" size={48} />
                  </div>
                )}

                <span className="absolute left-3 top-3 rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-alert shadow-sm">
                  Entregado
                </span>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1">
                    <MapPin size={12} />
                    {delivery.city}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1">
                    <CalendarDays size={12} />
                    {formatDate(delivery.deliveredAt)}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-semibold leading-snug">
                  {delivery.title}
                </h3>

                <p className="mt-1 text-sm font-semibold text-alert">
                  {delivery.productName}
                </p>

                <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                  {delivery.description ||
                    "Entrega realizada con coordinación directa y producto verificado."}
                </p>

                <p className="mt-4 text-xs font-semibold text-slate-600">
                  {delivery.customerName || "Cliente RCA"}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <Link
            href="/entregas"
            className="text-sm font-semibold text-brand transition hover:text-brand-hover"
          >
            Ver más entregas →
          </Link>
        </div>
      </div>
    </section>
  );
}
