"use client";

import AdminShell from "@/components/AdminShell";
import {
  PROVEEDOR,
  TIPO_LABELS,
  getAdminReclamos,
  getDeadline,
  saveReclamoRespuesta,
  type Reclamo,
} from "@/lib/libro-reclamaciones";
import { supabase } from "@/lib/supabase";
import {
  AlarmClock,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock,
  Mail,
  RefreshCw,
  Save,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Filter = "Todas" | "Pendientes" | "Respondidas";

function getTodayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDate(value: Date) {
  return value.toLocaleDateString("es-PE", { dateStyle: "medium" });
}

/** Días calendario que faltan para la fecha límite (negativo = vencido). */
function daysLeft(reclamo: Reclamo) {
  const deadline = getDeadline(reclamo.createdAt);
  return Math.ceil((deadline.getTime() - Date.now()) / 86400000);
}

export default function AdminReclamacionesPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState<Filter>("Todas");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    async function checkSessionAndLoad() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        router.push("/admin/login");
        return;
      }

      setReady(true);
      await loadReclamos();
    }

    checkSessionAndLoad();
    // Solo al entrar a la página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadReclamos() {
    setLoading(true);

    const result = await getAdminReclamos();

    setReclamos(result.reclamos);
    setLoadError(result.error);
    setLoading(false);
  }

  const stats = useMemo(() => {
    const pending = reclamos.filter((item) => item.estado === "pendiente");

    return {
      total: reclamos.length,
      pending: pending.length,
      overdue: pending.filter((item) => daysLeft(item) < 0).length,
      answered: reclamos.length - pending.length,
    };
  }, [reclamos]);

  const visible = useMemo(() => {
    if (filter === "Pendientes") {
      return reclamos.filter((item) => item.estado === "pendiente");
    }

    if (filter === "Respondidas") {
      return reclamos.filter((item) => item.estado === "respondido");
    }

    return reclamos;
  }, [reclamos, filter]);

  const selected = reclamos.find((item) => item.id === selectedId) ?? null;

  function handleSaved(updated: Reclamo) {
    setReclamos((current) =>
      current.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  if (!ready) {
    return null;
  }

  return (
    <AdminShell
      title="Libro de Reclamaciones"
      description={`Hojas registradas por los clientes desde la web. Debes responder cada una en un máximo de 15 días hábiles.`}
    >
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title="Total" value={stats.total} icon={BookOpen} color="text-[#0057A8]" bg="bg-blue-50" />
        <StatCard title="Pendientes" value={stats.pending} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        <StatCard title="Vencidas" value={stats.overdue} icon={AlarmClock} color="text-[#E31B23]" bg="bg-red-50" />
        <StatCard title="Respondidas" value={stats.answered} icon={CheckCircle2} color="text-green-700" bg="bg-green-50" />
      </section>

      {loadError && (
        <div className="mt-6 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-[#E31B23]">
          <XCircle className="shrink-0" />
          <p>
            No se pudo cargar el libro. ¿Ya ejecutaste el archivo
            supabase-reclamaciones.sql en Supabase? ({loadError})
          </p>
        </div>
      )}

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1fr]">
        {/* Listado */}
        <div className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              {(["Todas", "Pendientes", "Respondidas"] as Filter[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-4 py-2 text-xs font-black transition ${
                    filter === option
                      ? "bg-[#0057A8] text-white"
                      : "bg-[#f6f8fc] text-slate-600 hover:text-[#0057A8]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={loadReclamos}
              aria-label="Actualizar listado"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#0057A8] hover:text-[#0057A8]"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="mt-4 grid gap-2">
            {loading ? (
              <p className="rounded-2xl bg-[#f6f8fc] p-6 text-center text-sm font-semibold text-slate-500">
                Cargando hojas...
              </p>
            ) : visible.length === 0 ? (
              <p className="rounded-2xl bg-[#f6f8fc] p-6 text-center text-sm font-semibold text-slate-500">
                {reclamos.length === 0
                  ? "Aún no hay hojas registradas."
                  : "No hay hojas con este filtro."}
              </p>
            ) : (
              visible.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    item.id === selectedId
                      ? "border-[#0057A8] bg-blue-50/50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-black">{item.codigo}</p>
                    <DeadlineBadge reclamo={item} />
                  </div>

                  <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                    {TIPO_LABELS[item.tipo]} · {item.nombre}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatDateTime(item.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detalle */}
        {selected ? (
          <ReclamoDetail key={selected.id} reclamo={selected} onSaved={handleSaved} />
        ) : (
          <div className="flex h-fit flex-col items-center rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookOpen className="text-slate-300" size={40} />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Elige una hoja para ver el detalle y registrar tu respuesta.
            </p>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

/* ---------------------------------------------------------------- */

function ReclamoDetail({
  reclamo,
  onSaved,
}: {
  reclamo: Reclamo;
  onSaved: (updated: Reclamo) => void;
}) {
  const [respuesta, setRespuesta] = useState(reclamo.respuesta);
  const [fechaRespuesta, setFechaRespuesta] = useState(
    reclamo.fechaRespuesta || getTodayDate()
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const mailto = useMemo(() => {
    const subject = `Respuesta a su Hoja de Reclamación ${reclamo.codigo} · ${PROVEEDOR.nombreComercial}`;
    const body = `Estimado(a) ${reclamo.nombre}:\n\nEn atención a su ${TIPO_LABELS[reclamo.tipo].toLowerCase()} registrado(a) con la Hoja N.° ${reclamo.codigo}, le informamos lo siguiente:\n\n${respuesta || "[Escriba aquí la respuesta]"}\n\nAtentamente,\n${PROVEEDOR.nombreComercial}`;

    return `mailto:${reclamo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }, [reclamo, respuesta]);

  async function save(estado: Reclamo["estado"]) {
    if (estado === "respondido" && !respuesta.trim()) {
      setMessage({ ok: false, text: "Escribe la respuesta antes de marcarla como respondida." });
      return;
    }

    setSaving(true);
    setMessage(null);

    const { error } = await saveReclamoRespuesta(
      reclamo.id,
      respuesta,
      estado === "respondido" ? fechaRespuesta : "",
      estado
    );

    setSaving(false);

    if (error) {
      setMessage({ ok: false, text: `No se pudo guardar: ${error}` });
      return;
    }

    onSaved({
      ...reclamo,
      respuesta: respuesta.trim(),
      fechaRespuesta: estado === "respondido" ? fechaRespuesta : "",
      estado,
    });

    setMessage({
      ok: true,
      text: estado === "respondido" ? "Hoja marcada como respondida." : "Respuesta guardada como borrador.",
    });
  }

  return (
    <div className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
            {TIPO_LABELS[reclamo.tipo]}
          </p>
          <h2 className="mt-2 text-2xl font-black">{reclamo.codigo}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Registrada el {formatDateTime(reclamo.createdAt)} · Responder hasta el{" "}
            {formatDate(getDeadline(reclamo.createdAt))} (aprox.)
          </p>
        </div>
        <DeadlineBadge reclamo={reclamo} />
      </div>

      <DetailBlock
        title="Consumidor"
        rows={[
          ["Nombre", reclamo.nombre],
          [reclamo.tipoDocumento, reclamo.numeroDocumento],
          ["Domicilio", reclamo.domicilio],
          ["Teléfono", reclamo.telefono],
          ["Correo", reclamo.email],
          ...(reclamo.esMenor
            ? ([
                ["Apoderado", reclamo.apoderadoNombre],
                ["Doc. apoderado", reclamo.apoderadoDocumento],
              ] as [string, string][])
            : []),
        ]}
      />

      <DetailBlock
        title="Bien contratado"
        rows={[
          ["Tipo", reclamo.tipoBien === "servicio" ? "Servicio" : "Producto"],
          ["Monto", reclamo.monto ? `S/ ${reclamo.monto}` : ""],
          ["Descripción", reclamo.descripcionBien],
          ["Pedido / comprobante", reclamo.numeroPedido],
        ]}
      />

      <DetailBlock
        title="Reclamación"
        rows={[
          ["Detalle", reclamo.detalle],
          ["Pedido del cliente", reclamo.pedido],
        ]}
      />

      {/* Respuesta del proveedor */}
      <div className="mt-6 rounded-2xl bg-[#f6f8fc] p-5">
        <p className="text-sm font-black">Acciones adoptadas por el proveedor</p>

        <textarea
          value={respuesta}
          onChange={(event) => setRespuesta(event.target.value)}
          rows={5}
          placeholder="Escribe la respuesta o solución que se le dio al cliente"
          className="mt-3 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-[#0057A8]"
        />

        <label className="mt-3 block text-xs font-black text-slate-600">
          Fecha de respuesta
          <input
            type="date"
            value={fechaRespuesta}
            onChange={(event) => setFechaRespuesta(event.target.value)}
            className="mt-1.5 block h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-[#0057A8]"
          />
        </label>

        {message && (
          <p
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold ${
              message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-[#E31B23]"
            }`}
          >
            {message.text}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={mailto}
            className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-5 py-3 text-sm font-black text-white transition hover:bg-[#00468a]"
          >
            <Mail size={16} />
            Responder por correo
          </a>

          <button
            type="button"
            disabled={saving}
            onClick={() => save("respondido")}
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-black text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            <BadgeCheck size={16} />
            Marcar como respondida
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => save("pendiente")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-[#0057A8] hover:text-[#0057A8] disabled:opacity-60"
          >
            <Save size={16} />
            {reclamo.estado === "respondido" ? "Reabrir como pendiente" : "Guardar borrador"}
          </button>
        </div>

        <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
          &quot;Responder por correo&quot; abre tu correo con el texto listo para el
          cliente. Después de enviarlo, marca la hoja como respondida.
        </p>
      </div>
    </div>
  );
}

function DeadlineBadge({ reclamo }: { reclamo: Reclamo }) {
  if (reclamo.estado === "respondido") {
    return (
      <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-black text-green-700">
        Respondida
      </span>
    );
  }

  const left = daysLeft(reclamo);

  if (left < 0) {
    return (
      <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-black text-[#E31B23]">
        Vencida
      </span>
    );
  }

  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-black ${
        left <= 5 ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-[#0057A8]"
      }`}
    >
      {left === 0 ? "Vence hoy" : `Faltan ${left} días`}
    </span>
  );
}

function DetailBlock({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="mt-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <dl className="mt-2 divide-y divide-slate-100 rounded-2xl border border-slate-200 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-4 py-2.5 sm:grid-cols-[34%_1fr]">
            <dt className="font-semibold text-slate-500">{label}</dt>
            <dd className="whitespace-pre-line break-words font-bold text-slate-800">
              {value || "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
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
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
}) {
  return (
    <div className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
        </div>

        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${bg}`}>
          <Icon className={color} size={24} />
        </div>
      </div>
    </div>
  );
}
