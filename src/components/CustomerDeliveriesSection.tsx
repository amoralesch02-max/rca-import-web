"use client";

import Link from "next/link";
import { CalendarDays, MapPin, PackageCheck, Sparkles } from "lucide-react";
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
    <section className="mt-12 overflow-hidden rounded-[3rem] border border-slate-200 bg-white p-8 shadow-sm md:p-10">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#0057A8]">
          <PackageCheck size={16} />
          Clientes satisfechos
        </div>

        <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
          Entregas realizadas por RCA IMPORT
        </h2>

        <p className="mt-5 text-base font-semibold leading-8 text-slate-500">
          Algunas compras entregadas a nuestros clientes. Cada pedido es
          coordinado con atención personalizada, verificación del producto y
          comunicación directa.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {deliveries.map((delivery) => (
          <article
            key={delivery.id}
            className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f6f8fc] transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200"
          >
            <div className="relative h-72 overflow-hidden bg-slate-100">
              {delivery.imageUrl ? (
                <img
                  src={delivery.imageUrl}
                  alt={delivery.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <PackageCheck className="text-slate-300" size={52} />
                </div>
              )}

              <div className="absolute left-4 top-4 rounded-full bg-white/95 px-4 py-2 text-xs font-black text-[#E31B23] shadow-sm">
                Entregado
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#0057A8]">
                  <MapPin size={14} />
                  {delivery.city}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600">
                  <CalendarDays size={14} />
                  {formatDate(delivery.deliveredAt)}
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-black leading-tight text-slate-950">
                {delivery.title}
              </h3>

              <p className="mt-2 text-sm font-black text-[#E31B23]">
                {delivery.productName}
              </p>

              <p className="mt-4 line-clamp-3 text-sm font-semibold leading-7 text-slate-500">
                {delivery.description ||
                  "Entrega realizada con coordinación directa y producto verificado."}
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-black text-slate-700">
                <Sparkles className="text-[#0057A8]" size={18} />
                {delivery.customerName || "Cliente RCA"}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href="/entregas"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 text-sm font-black text-white shadow-lg shadow-slate-300 transition hover:bg-[#0057A8]"
        >
          Ver más entregas
          <PackageCheck size={18} />
        </Link>
      </div>
    </section>
  );
}