"use client";

import AdminShell from "@/components/AdminShell";
import {
  getSupabaseAdminReservations,
  type PublicReservation,
  updateSupabaseReservationStatus,
} from "@/lib/supabase-reservations";
import { createPaymentProofSignedUrl } from "@/lib/supabase-storage";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  ExternalLink,
  FileText,
  Filter,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const paymentStatusOptions = [
  "Pendiente de confirmación",
  "Pago confirmado",
  "Reservado",
  "Pago rechazado",
  "Cancelado",
];

function getStatusStyle(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("confirmado") || normalized.includes("reservado")) {
    return "bg-green-50 text-green-700";
  }

  if (normalized.includes("rechazado") || normalized.includes("cancelado")) {
    return "bg-red-50 text-[#E31B23]";
  }

  return "bg-amber-50 text-amber-700";
}

function getStatusIcon(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("confirmado") || normalized.includes("reservado")) {
    return BadgeCheck;
  }

  if (normalized.includes("rechazado") || normalized.includes("cancelado")) {
    return XCircle;
  }

  return Clock;
}

function formatDate(date: string) {
  if (!date) {
    return "Sin fecha";
  }

  return new Date(date).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getWhatsappLink(reservation: PublicReservation) {
  const cleanPhone = reservation.phone.replace(/\D/g, "");

  const message = `Hola ${reservation.customerName}, te escribimos de RCA IMPORT sobre el pago de tu reserva ${reservation.id}. El estado actual es: ${reservation.status}.`;

  return `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(message)}`;
}

function hasPaymentProof(reservation: PublicReservation) {
  return Boolean(
    reservation.paymentProofName ||
      reservation.paymentProofPath ||
      reservation.paymentProofUrl
  );
}

export default function AdminPaymentsPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [reservations, setReservations] = useState<PublicReservation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [loadingProofId, setLoadingProofId] = useState("");
  const [proofError, setProofError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");

  const [proofModal, setProofModal] = useState({
    open: false,
    imageUrl: "",
    fileName: "",
    reservationCode: "",
  });

  useEffect(() => {
    async function checkSessionAndLoad() {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        localStorage.removeItem("rca_import_admin_session");
        router.push("/admin/login");
        return;
      }

      setReady(true);
      await loadReservations();
    }

    checkSessionAndLoad();
  }, [router]);

  async function loadReservations() {
    setLoading(true);
    setProofError("");

    const supabaseReservations = await getSupabaseAdminReservations();

    setReservations(supabaseReservations);
    setLoading(false);
  }

  async function changeStatus(reservationId: string, status: string) {
    setUpdatingId(reservationId);

    const result = await updateSupabaseReservationStatus(reservationId, status);

    if (result.success) {
      setReservations((currentReservations) =>
        currentReservations.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, status }
            : reservation
        )
      );
    }

    setUpdatingId("");
  }

  async function openPaymentProof(reservation: PublicReservation) {
    setProofError("");

    if (!reservation.paymentProofPath && !reservation.paymentProofUrl) {
      setProofError(
        `La reserva ${reservation.id} no tiene una captura disponible para abrir.`
      );
      return;
    }

    setLoadingProofId(reservation.id);

    if (reservation.paymentProofUrl) {
      setProofModal({
        open: true,
        imageUrl: reservation.paymentProofUrl,
        fileName: reservation.paymentProofName || "Comprobante de pago",
        reservationCode: reservation.id,
      });

      setLoadingProofId("");
      return;
    }

    const result = await createPaymentProofSignedUrl(
      reservation.paymentProofPath
    );

    setLoadingProofId("");

    if (!result.success) {
      setProofError(
        "No se pudo abrir el comprobante. Verifica que la captura exista en Supabase Storage."
      );
      return;
    }

    setProofModal({
      open: true,
      imageUrl: result.url,
      fileName: reservation.paymentProofName || "Comprobante de pago",
      reservationCode: reservation.id,
    });
  }

  function closeProofModal() {
    setProofModal({
      open: false,
      imageUrl: "",
      fileName: "",
      reservationCode: "",
    });
  }

  async function copyReservationCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);

    setTimeout(() => {
      setCopiedCode("");
    }, 1600);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("Todos");
  }

  const filteredPayments = useMemo(() => {
    let result = [...reservations];

    if (statusFilter !== "Todos") {
      result = result.filter(
        (reservation) => reservation.status === statusFilter
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (reservation) =>
          reservation.id.toLowerCase().includes(query) ||
          reservation.customerName.toLowerCase().includes(query) ||
          reservation.phone.toLowerCase().includes(query) ||
          reservation.documentNumber.toLowerCase().includes(query) ||
          reservation.paymentMethod.toLowerCase().includes(query) ||
          reservation.paymentProofName.toLowerCase().includes(query)
      );
    }

    return result;
  }, [reservations, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = reservations.filter(
      (reservation) => reservation.status === "Pendiente de confirmación"
    ).length;

    const confirmed = reservations.filter(
      (reservation) =>
        reservation.status === "Pago confirmado" ||
        reservation.status === "Reservado"
    ).length;

    const rejected = reservations.filter(
      (reservation) =>
        reservation.status === "Pago rechazado" ||
        reservation.status === "Cancelado"
    ).length;

    const withProof = reservations.filter((reservation) =>
      hasPaymentProof(reservation)
    ).length;

    const declaredAmount = reservations.reduce(
      (sum, reservation) => sum + reservation.amountPaid,
      0
    );

    const confirmedAmount = reservations
      .filter(
        (reservation) =>
          reservation.status === "Pago confirmado" ||
          reservation.status === "Reservado"
      )
      .reduce((sum, reservation) => sum + reservation.amountPaid, 0);

    return {
      total: reservations.length,
      pending,
      confirmed,
      rejected,
      withProof,
      declaredAmount,
      confirmedAmount,
    };
  }, [reservations]);

  const activeFilterCount = [
    Boolean(search.trim()),
    statusFilter !== "Todos",
  ].filter(Boolean).length;

  if (!ready) {
    return null;
  }

  return (
    <AdminShell
      title="Pagos"
      description="Valida pagos declarados, capturas de comprobantes y estados de reserva desde Supabase."
    >
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <StatCard
          title="Pagos"
          value={stats.total}
          icon={Wallet}
          color="text-[#0057A8]"
          bg="bg-blue-50"
        />

        <StatCard
          title="Pendientes"
          value={stats.pending}
          icon={Clock}
          color="text-amber-700"
          bg="bg-amber-50"
        />

        <StatCard
          title="Confirmados"
          value={stats.confirmed}
          icon={BadgeCheck}
          color="text-green-700"
          bg="bg-green-50"
        />

        <StatCard
          title="Rechazados"
          value={stats.rejected}
          icon={XCircle}
          color="text-[#E31B23]"
          bg="bg-red-50"
        />

        <StatCard
          title="Comprobantes"
          value={stats.withProof}
          icon={FileText}
          color="text-purple-700"
          bg="bg-purple-50"
        />

        <StatCard
          title="Confirmado"
          value={`S/ ${stats.confirmedAmount}`}
          icon={CheckCircle2}
          color="text-green-700"
          bg="bg-green-50"
        />
      </section>

      <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_260px_160px]">
          <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
            <Search className="shrink-0 text-slate-400" size={20} />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por código, cliente, celular, documento, método o comprobante..."
              className="h-full w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 transition hover:text-[#E31B23]"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-14 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 text-sm font-black outline-none transition focus:border-[#0057A8] focus:bg-white"
          >
            <option>Todos</option>
            {paymentStatusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadReservations}
            disabled={loading}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={loading ? "animate-spin" : ""} size={17} />
            Recargar
          </button>
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl bg-blue-50 p-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <Filter className="text-[#0057A8]" size={20} />

              <p className="text-sm font-black text-[#0057A8]">
                {activeFilterCount} filtro(s) aplicado(s)
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:text-[#E31B23]"
            >
              <X size={14} />
              Limpiar filtros
            </button>
          </div>
        )}

        {proofError && (
          <div className="mt-5 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-[#E31B23]">
            <AlertTriangle className="shrink-0" />
            <p>{proofError}</p>
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Validación de pagos
            </p>

            <h2 className="mt-3 text-3xl font-black">
              {filteredPayments.length} resultado(s)
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Total declarado: S/ {stats.declaredAmount}
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#f6f8fc] px-5 py-3 text-sm font-black text-slate-600">
            <ShieldCheck size={18} className="text-[#0057A8]" />
            Comprobantes privados
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <RefreshCw
              className="mx-auto mb-4 animate-spin text-[#0057A8]"
              size={42}
            />

            <p className="font-black">Cargando pagos desde Supabase...</p>
          </div>
        ) : filteredPayments.length > 0 ? (
          <>
            <div className="grid gap-4 p-4 xl:hidden">
              {filteredPayments.map((reservation) => (
                <MobilePaymentCard
                  key={reservation.id}
                  reservation={reservation}
                  updatingId={updatingId}
                  loadingProofId={loadingProofId}
                  copiedCode={copiedCode}
                  onChangeStatus={changeStatus}
                  onOpenProof={openPaymentProof}
                  onCopyCode={copyReservationCode}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-950 text-white">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Cliente
                    </th>

                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Código
                    </th>

                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Pago
                    </th>

                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Comprobante
                    </th>

                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Estado
                    </th>

                    <th className="px-6 py-4 text-xs font-black uppercase tracking-[0.16em]">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPayments.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="border-b border-slate-200 last:border-b-0"
                    >
                      <td className="min-w-[250px] px-6 py-5 align-top">
                        <CustomerBlock reservation={reservation} />
                      </td>

                      <td className="min-w-[220px] px-6 py-5 align-top">
                        <CodeBlock
                          reservation={reservation}
                          copiedCode={copiedCode}
                          onCopyCode={copyReservationCode}
                        />
                      </td>

                      <td className="min-w-[190px] px-6 py-5 align-top">
                        <PaymentAmountBlock reservation={reservation} />
                      </td>

                      <td className="min-w-[260px] px-6 py-5 align-top">
                        <ProofBlock
                          reservation={reservation}
                          loadingProofId={loadingProofId}
                          onOpenProof={openPaymentProof}
                        />
                      </td>

                      <td className="min-w-[230px] px-6 py-5 align-top">
                        <StatusControl
                          reservation={reservation}
                          updatingId={updatingId}
                          onChangeStatus={changeStatus}
                        />
                      </td>

                      <td className="min-w-[180px] px-6 py-5 align-top">
                        <PaymentActions
                          reservation={reservation}
                          updatingId={updatingId}
                          onChangeStatus={changeStatus}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </section>

      <section className="mt-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-200">
        <div className="grid gap-6 md:grid-cols-[1fr_0.35fr] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
              Pagos manuales
            </p>

            <h2 className="mt-3 text-3xl font-black">
              La validación de pagos actualiza el estado del cliente.
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
              Al confirmar o rechazar un pago, el cliente podrá ver el cambio
              desde Estado de pedido usando su código de reserva.
            </p>
          </div>

          <Wallet className="text-blue-300" size={52} />
        </div>
      </section>

      {proofModal.open && (
        <ProofModal proofModal={proofModal} onClose={closeProofModal} />
      )}
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
  value: string | number;
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

          <p className="mt-2 truncate text-2xl font-black text-slate-950">
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

function StatusBadge({ status }: { status: string }) {
  const Icon = getStatusIcon(status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${getStatusStyle(
        status
      )}`}
    >
      <Icon size={15} />
      {status}
    </span>
  );
}

function CustomerBlock({ reservation }: { reservation: PublicReservation }) {
  return (
    <div>
      <p className="font-black text-slate-950">{reservation.customerName}</p>

      <p className="mt-1 text-sm font-semibold text-slate-500">
        DNI: {reservation.documentNumber}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-500">
        Cel: {reservation.phone}
      </p>
    </div>
  );
}

function CodeBlock({
  reservation,
  copiedCode,
  onCopyCode,
}: {
  reservation: PublicReservation;
  copiedCode: string;
  onCopyCode: (code: string) => void;
}) {
  return (
    <div>
      <p className="font-black text-[#0057A8]">{reservation.id}</p>

      <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-400">
        <CalendarClock size={14} />
        {formatDate(reservation.createdAt)}
      </p>

      <button
        type="button"
        onClick={() => onCopyCode(reservation.id)}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-[#0057A8] transition hover:bg-blue-100"
      >
        <Copy size={14} />
        {copiedCode === reservation.id ? "Copiado" : "Copiar código"}
      </button>
    </div>
  );
}

function PaymentAmountBlock({
  reservation,
}: {
  reservation: PublicReservation;
}) {
  return (
    <div>
      <p className="text-xl font-black text-[#E31B23]">
        S/ {reservation.amountPaid}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-500">
        Total: S/ {reservation.total}
      </p>

      <p className="mt-1 text-xs font-bold text-slate-400">
        Método: {reservation.paymentMethod}
      </p>
    </div>
  );
}

function ProofBlock({
  reservation,
  loadingProofId,
  onOpenProof,
}: {
  reservation: PublicReservation;
  loadingProofId: string;
  onOpenProof: (reservation: PublicReservation) => void;
}) {
  if (!hasPaymentProof(reservation)) {
    return (
      <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-700">
        <AlertTriangle className="shrink-0" size={18} />

        <p className="text-xs font-black">
          No registró captura de comprobante.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#f6f8fc] p-4">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
        Comprobante registrado
      </p>

      <p className="mt-2 max-w-[220px] truncate text-sm font-black text-slate-700">
        {reservation.paymentProofName || "Captura de pago"}
      </p>

      <button
        type="button"
        onClick={() => onOpenProof(reservation)}
        disabled={
          loadingProofId === reservation.id ||
          (!reservation.paymentProofPath && !reservation.paymentProofUrl)
        }
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0057A8] px-4 py-3 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Eye size={16} />
        {loadingProofId === reservation.id ? "Abriendo..." : "Ver comprobante"}
      </button>
    </div>
  );
}

function StatusControl({
  reservation,
  updatingId,
  onChangeStatus,
}: {
  reservation: PublicReservation;
  updatingId: string;
  onChangeStatus: (reservationId: string, status: string) => void;
}) {
  return (
    <div>
      <StatusBadge status={reservation.status} />

      <select
        value={reservation.status}
        disabled={updatingId === reservation.id}
        onChange={(event) =>
          onChangeStatus(reservation.id, event.target.value)
        }
        className="mt-3 block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-[#0057A8] disabled:opacity-60"
      >
        {paymentStatusOptions.map((status) => (
          <option key={status}>{status}</option>
        ))}
      </select>

      {updatingId === reservation.id && (
        <p className="mt-2 text-xs font-black text-[#0057A8]">
          Actualizando...
        </p>
      )}
    </div>
  );
}

function PaymentActions({
  reservation,
  updatingId,
  onChangeStatus,
}: {
  reservation: PublicReservation;
  updatingId: string;
  onChangeStatus: (reservationId: string, status: string) => void;
}) {
  const isUpdating = updatingId === reservation.id;

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => onChangeStatus(reservation.id, "Pago confirmado")}
        disabled={isUpdating}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-xs font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <BadgeCheck size={16} />
        Confirmar
      </button>

      <button
        type="button"
        onClick={() => onChangeStatus(reservation.id, "Pago rechazado")}
        disabled={isUpdating}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E31B23] px-4 py-3 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <XCircle size={16} />
        Rechazar
      </button>

      <Link
        href={`/estado-pedido?codigo=${reservation.id}`}
        target="_blank"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0057A8] px-4 py-3 text-xs font-black text-white transition hover:bg-blue-700"
      >
        <Eye size={16} />
        Ver estado
      </Link>

      <a
        href={getWhatsappLink(reservation)}
        target="_blank"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
      >
        <MessageCircle size={16} />
        WhatsApp
      </a>
    </div>
  );
}

function MobilePaymentCard({
  reservation,
  updatingId,
  loadingProofId,
  copiedCode,
  onChangeStatus,
  onOpenProof,
  onCopyCode,
}: {
  reservation: PublicReservation;
  updatingId: string;
  loadingProofId: string;
  copiedCode: string;
  onChangeStatus: (reservationId: string, status: string) => void;
  onOpenProof: (reservation: PublicReservation) => void;
  onCopyCode: (code: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <StatusBadge status={reservation.status} />

            <h3 className="mt-3 text-xl font-black text-slate-950">
              {reservation.customerName}
            </h3>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {reservation.id}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onCopyCode(reservation.id)}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-[#0057A8]"
          >
            <Copy size={14} />
            {copiedCode === reservation.id ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 bg-[#f6f8fc] p-4 sm:grid-cols-3">
        <MiniInfo
          icon={Wallet}
          title="Pagado"
          value={`S/ ${reservation.amountPaid}`}
        />

        <MiniInfo icon={Wallet} title="Total" value={`S/ ${reservation.total}`} />

        <MiniInfo
          icon={FileText}
          title="Comprobante"
          value={hasPaymentProof(reservation) ? "Sí" : "No"}
        />
      </div>

      <div className="grid gap-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoLine
            icon={UserRound}
            title="Documento"
            value={reservation.documentNumber}
          />

          <InfoLine icon={Phone} title="Celular" value={reservation.phone} />

          <InfoLine
            icon={CalendarClock}
            title="Fecha"
            value={formatDate(reservation.createdAt)}
          />

          <InfoLine
            icon={Wallet}
            title="Método"
            value={reservation.paymentMethod}
          />
        </div>

        <ProofBlock
          reservation={reservation}
          loadingProofId={loadingProofId}
          onOpenProof={onOpenProof}
        />

        <StatusControl
          reservation={reservation}
          updatingId={updatingId}
          onChangeStatus={onChangeStatus}
        />

        <PaymentActions
          reservation={reservation}
          updatingId={updatingId}
          onChangeStatus={onChangeStatus}
        />
      </div>
    </article>
  );
}

function MiniInfo({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <Icon className="text-[#0057A8]" size={20} />

      <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f6f8fc] p-4">
      <div className="flex gap-3">
        <Icon className="shrink-0 text-[#0057A8]" size={19} />

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>

          <p className="mt-1 truncate text-sm font-black text-slate-700">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <XCircle className="mx-auto mb-4 text-slate-400" size={46} />

      <p className="text-2xl font-black">No hay pagos encontrados.</p>

      <p className="mt-2 text-sm font-semibold text-slate-500">
        Cuando un cliente registre una reserva con pago, aparecerá aquí.
      </p>
    </div>
  );
}

function ProofModal({
  proofModal,
  onClose,
}: {
  proofModal: {
    open: boolean;
    imageUrl: string;
    fileName: string;
    reservationCode: string;
  };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/30">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#E31B23]">
              Comprobante de pago
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {proofModal.reservationCode}
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {proofModal.fileName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto bg-[#f6f8fc] p-6">
          <img
            src={proofModal.imageUrl}
            alt={proofModal.fileName}
            className="mx-auto max-h-[70vh] rounded-2xl border border-slate-200 bg-white object-contain shadow-sm"
          />
        </div>

        <div className="grid gap-3 p-6 sm:grid-cols-2">
          <a
            href={proofModal.imageUrl}
            target="_blank"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 text-sm font-black text-white transition hover:bg-blue-700"
          >
            Abrir en nueva pestaña
            <ExternalLink size={16} />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="h-14 rounded-2xl bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}