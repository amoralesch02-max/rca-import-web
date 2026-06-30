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
  createSupabaseReservation,
  type ReservationCartItem,
} from "@/lib/supabase-reservations";
import { uploadPaymentProofFile } from "@/lib/supabase-storage";
import {
  AlertCircle,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  ImageIcon,
  LockKeyhole,
  MapPin,
  MessageCircle,
  PackageCheck,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  UploadCloud,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CartItem = ReservationCartItem;

type Reservation = {
  id: string;
  createdAt: string;
  customerName: string;
  documentNumber: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  operationType: string;
  paymentMethod: string;
  amountPaid: string;
  paymentProofName: string;
  paymentProofPath: string;
  paymentProofUrl: string;
  cart: CartItem[];
  total: number;
  status: string;
};

const CART_KEY = "rca_import_cart";
const RESERVATIONS_KEY = "rca_import_reservations";
const LAST_RESERVATION_KEY = "rca_import_last_reservation";

function generateReservationId() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `RCA-${year}-${random}`;
}

function getStoredCart() {
  if (typeof window === "undefined") {
    return [];
  }

  const storedCart = localStorage.getItem(CART_KEY);

  if (!storedCart) {
    return [];
  }

  try {
    return JSON.parse(storedCart) as CartItem[];
  } catch {
    return [];
  }
}

async function sendReservationEmail({
  reservation,
  amountPaidNumber,
  pendingAmount,
}: {
  reservation: Reservation;
  amountPaidNumber: number;
  pendingAmount: number;
}) {
  try {
    const response = await fetch("/api/reservation-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reservationCode: reservation.id,
        customerName: reservation.customerName,
        customerPhone: reservation.phone,
        customerEmail: "",
        customerDni: reservation.documentNumber,
        deliveryMethod: reservation.operationType,
        deliveryAddress: reservation.address,
        city: `${reservation.department} - ${reservation.city}`,
        paymentMethod: reservation.paymentMethod,
        amountPaid: amountPaidNumber,
        pendingAmount,
        total: reservation.total,
        paymentProofUrl: reservation.paymentProofUrl,
        createdAt: reservation.createdAt,
        items: reservation.cart.map((item) => ({
          name: item.name,
          variant: item.variant,
          color: item.variant,
          quantity: item.quantity,
          price: item.price,
        })),
      }),
    });

    if (!response.ok) {
      console.error("No se pudo enviar el correo de reserva.");
    }
  } catch (error) {
    console.error("Error enviando correo de reserva:", error);
  }
}

export default function ReservationPage() {
  const router = useRouter();

  const [settings, setSettings] =
    useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    documentNumber: "",
    phone: "",
    department: "",
    city: "",
    address: "",
    operationType: "Separación con adelanto",
    paymentMethod: "Yape",
    amountPaid: "",
  });

  useEffect(() => {
    async function loadSettings() {
      const supabaseSettings = await getSupabaseStoreSettings();
      setSettings(supabaseSettings);
    }

    loadSettings();
    setCart(getStoredCart());
  }, []);

  useEffect(() => {
    return () => {
      if (paymentProofPreview) {
        URL.revokeObjectURL(paymentProofPreview);
      }
    };
  }, [paymentProofPreview]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalUnits = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const hasIphoneInCart = useMemo(() => {
    return cart.some((item) => {
      const name = item.name.toLowerCase();
      const slug = item.slug.toLowerCase();

      return name.includes("iphone") || slug.includes("iphone");
    });
  }, [cart]);

  const minimumReservationAmount = hasIphoneInCart ? 50 : 20;

  const minimumReservationMessage = hasIphoneInCart
    ? "Tu reserva incluye un iPhone. El monto mínimo de separación es S/ 50."
    : "El monto mínimo de separación para estos productos es S/ 20.";

  const amountPaidNumber = Number(form.amountPaid || 0);
  const pendingAmount = Math.max(total - amountPaidNumber, 0);

  const whatsappUrl = getWhatsappUrl(
    settings.whatsappMain,
    "Hola, vengo de la web de RCA IMPORT. Quisiera confirmar una separación."
  );

  function saveCart(newCart: CartItem[]) {
    setCart(newCart);

    if (newCart.length === 0) {
      localStorage.removeItem(CART_KEY);
    } else {
      localStorage.setItem(CART_KEY, JSON.stringify(newCart));
    }

    window.dispatchEvent(new Event("rca-cart-updated"));
  }

  function removeItem(slug: string, variant: string) {
    const updatedCart = cart.filter(
      (item) => !(item.slug === slug && item.variant === variant)
    );

    saveCart(updatedCart);
  }

  function handlePaymentProofChange(file: File | null) {
    setErrorMessage("");

    if (!file) {
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("El comprobante debe ser una imagen PNG, JPG, JPEG o WEBP.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setErrorMessage("El comprobante no debe superar los 5 MB.");
      return;
    }

    if (paymentProofPreview) {
      URL.revokeObjectURL(paymentProofPreview);
    }

    setPaymentProofFile(file);
    setPaymentProofPreview(URL.createObjectURL(file));
  }

  function clearPaymentProof() {
    if (paymentProofPreview) {
      URL.revokeObjectURL(paymentProofPreview);
    }

    setPaymentProofFile(null);
    setPaymentProofPreview("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (cart.length === 0) {
      setErrorMessage("Tu carrito está vacío. Agrega un producto antes de separar.");
      return;
    }

    if (
      !form.customerName.trim() ||
      !form.documentNumber.trim() ||
      !form.phone.trim() ||
      !form.department.trim() ||
      !form.city.trim() ||
      !form.address.trim() ||
      !form.amountPaid.trim()
    ) {
      setErrorMessage("Completa todos los campos obligatorios antes de continuar.");
      return;
    }

    if (!paymentProofFile) {
      setErrorMessage("Sube la captura del pago por Yape antes de registrar la reserva.");
      return;
    }

    if (Number.isNaN(amountPaidNumber) || amountPaidNumber <= 0) {
      setErrorMessage("Ingresa un monto válido para el adelanto o pago.");
      return;
    }

        if (amountPaidNumber < minimumReservationAmount) {
      setErrorMessage(
        `El monto mínimo de separación es S/ ${minimumReservationAmount}.`
      );
      return;
    }

    setSubmitting(true);
    setUploadingProof(true);

    const proofUpload = await uploadPaymentProofFile(paymentProofFile);

    setUploadingProof(false);

    if (!proofUpload.success) {
      setSubmitting(false);
      setErrorMessage(
        proofUpload.error || "No se pudo subir el comprobante. Intenta nuevamente."
      );
      return;
    }

    const reservationId = generateReservationId();

    const newReservation: Reservation = {
      id: reservationId,
      createdAt: new Date().toISOString(),
      customerName: form.customerName.trim(),
      documentNumber: form.documentNumber.trim(),
      phone: form.phone.trim(),
      department: form.department.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      operationType: form.operationType,
      paymentMethod: form.paymentMethod,
      amountPaid: form.amountPaid,
      paymentProofName: proofUpload.fileName,
      paymentProofPath: proofUpload.path,
      paymentProofUrl: "",
      cart,
      total,
      status: "Pendiente de confirmación",
    };

    const result = await createSupabaseReservation({
      id: newReservation.id,
      customerName: newReservation.customerName,
      documentNumber: newReservation.documentNumber,
      phone: newReservation.phone,
      department: newReservation.department,
      city: newReservation.city,
      address: newReservation.address,
      operationType: newReservation.operationType,
      paymentMethod: newReservation.paymentMethod,
      amountPaid: amountPaidNumber,
      paymentProofName: newReservation.paymentProofName,
      paymentProofPath: newReservation.paymentProofPath,
      paymentProofUrl: "",
      total: newReservation.total,
      status: newReservation.status,
      cart: newReservation.cart,
    });

       if (!result.success) {
      setSubmitting(false);
      setErrorMessage(
        "No se pudo guardar la reserva en Supabase. Revisa los permisos o intenta nuevamente."
      );
      return;
    }

    await sendReservationEmail({
      reservation: newReservation,
      amountPaidNumber,
      pendingAmount,
    });

    const storedReservations = localStorage.getItem(RESERVATIONS_KEY);
    const currentReservations = storedReservations
      ? (JSON.parse(storedReservations) as Reservation[])
      : [];

    localStorage.setItem(
      RESERVATIONS_KEY,
      JSON.stringify([newReservation, ...currentReservations])
    );

    localStorage.setItem(LAST_RESERVATION_KEY, JSON.stringify(newReservation));
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event("rca-cart-updated"));

    router.push(`/reserva-confirmada?codigo=${reservationId}`);
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm font-bold text-slate-500">
          <Link href="/" className="transition hover:text-[#0057A8]">
            Inicio
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <Link href="/carrito" className="transition hover:text-[#0057A8]">
            Carrito
          </Link>

          <ChevronRight size={15} className="text-slate-300" />

          <span className="text-slate-950">Separar</span>
        </div>

        <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 p-7 text-white shadow-2xl shadow-slate-300 md:p-12">
          <div className="absolute right-[-150px] top-[-170px] h-96 w-96 rounded-full bg-[#0057A8]/30 blur-3xl" />
          <div className="absolute bottom-[-200px] left-[-130px] h-96 w-96 rounded-full bg-[#E31B23]/25 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-200">
                <ClipboardCheck size={16} />
                Separación RCA IMPORT
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Registra tu reserva con comprobante de Yape.
              </h1>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-slate-300 md:text-base">
                Completa tus datos, sube la captura del pago y RCA IMPORT
                validará tu reserva desde el panel de administración.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/carrito"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                >
                  <ChevronLeft size={18} />
                  Volver al carrito
                </Link>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-700"
                >
                  <MessageCircle size={18} />
                  Consultar ayuda
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MiniStat title="Productos" value={cart.length} />
              <MiniStat title="Unidades" value={totalUnits} />
              <MiniStat title="Total" value={`S/ ${total}`} large />
              <MiniStat title="Pago" value="Yape" />
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.78fr]">
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-200 bg-white p-6 md:p-8">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Datos del cliente
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Información para la reserva
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                Estos datos ayudarán a identificar tu reserva y coordinar la
                entrega o envío.
              </p>

              {errorMessage && (
                <div className="mt-6 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-[#E31B23]">
                  <AlertCircle className="shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              )}
            </div>

            <div className="p-6 md:p-8">
              <div className="grid gap-4 md:grid-cols-2">
                <FieldBlock label="Nombre completo *" icon={UserRound}>
                  <input
                    value={form.customerName}
                    onChange={(event) =>
                      setForm({ ...form, customerName: event.target.value })
                    }
                    className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                    placeholder="Ejemplo: Alisson Morales"
                  />
                </FieldBlock>

                <FieldBlock label="DNI / Documento *" icon={FileText}>
                  <input
                    value={form.documentNumber}
                    onChange={(event) =>
                      setForm({ ...form, documentNumber: event.target.value })
                    }
                    className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                    placeholder="Ejemplo: 12345678"
                  />
                </FieldBlock>

                <FieldBlock label="Celular *" icon={MessageCircle}>
                  <input
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                    className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                    placeholder="Ejemplo: 999 999 999"
                  />
                </FieldBlock>

                <FieldBlock label="Departamento *" icon={MapPin}>
                  <input
                    value={form.department}
                    onChange={(event) =>
                      setForm({ ...form, department: event.target.value })
                    }
                    className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                    placeholder="Ejemplo: Tacna"
                  />
                </FieldBlock>

                <FieldBlock label="Ciudad *" icon={Truck}>
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm({ ...form, city: event.target.value })
                    }
                    className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                    placeholder="Ejemplo: Tacna"
                  />
                </FieldBlock>

                <FieldBlock label="Tipo de operación" icon={ClipboardCheck}>
                  <select
                    value={form.operationType}
                    onChange={(event) =>
                      setForm({ ...form, operationType: event.target.value })
                    }
                    className="h-full w-full bg-transparent text-sm font-black outline-none"
                  >
                    <option>Separación con adelanto</option>
                    <option>Compra completa</option>
                    <option>Consulta para mayorista</option>
                  </select>
                </FieldBlock>

                <div className="md:col-span-2">
                  <FieldBlock label="Dirección *" icon={MapPin}>
                    <input
                      value={form.address}
                      onChange={(event) =>
                        setForm({ ...form, address: event.target.value })
                      }
                      className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                      placeholder="Dirección para envío o referencia"
                    />
                  </FieldBlock>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f6f8fc]">
                <div className="bg-slate-950 p-6 text-white">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-300">
                        <Wallet size={24} />
                      </div>

                      <div>
                        <p className="font-black">Pago manual por Yape</p>

                        <p className="mt-1 text-sm font-semibold text-slate-300">
                          {settings.yapeNumber} · {settings.yapeOwner}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black text-blue-200">
                      <LockKeyhole size={15} />
                      Comprobante privado
                    </span>
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-black text-slate-700">
                        Monto pagado *
                      </label>

                      <div className="mt-2 flex h-14 items-center rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-[#0057A8]">
                        <span className="mr-2 text-sm font-black text-slate-400">
                          S/
                        </span>

                                                <input
                          value={form.amountPaid}
                          onChange={(event) =>
                            setForm({ ...form, amountPaid: event.target.value })
                          }
                          type="number"
                          min={minimumReservationAmount}
                          className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                          placeholder={`Ejemplo: ${minimumReservationAmount}`}
                        />
                      </div>

                                            <div className="mt-2 grid gap-1">
                        <p className="text-xs font-black text-[#E31B23]">
                          {minimumReservationMessage}
                        </p>

                        <p className="text-xs font-semibold text-slate-500">
                          Saldo aproximado pendiente: S/ {pendingAmount}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-black text-slate-700">
                        Captura del comprobante *
                      </label>

                      <label className="mt-2 flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#0057A8] bg-white px-4 text-sm font-black text-[#0057A8] transition hover:bg-blue-50">
                        <UploadCloud size={19} />
                        {paymentProofFile ? "Cambiar captura" : "Subir captura"}

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          className="hidden"
                          disabled={submitting}
                          onChange={(event) => {
                            handlePaymentProofChange(
                              event.target.files?.[0] ?? null
                            );
                            event.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {paymentProofFile && (
                    <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white">
                      <div className="grid gap-4 p-4 md:grid-cols-[170px_1fr] md:items-center">
                        <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-[#f6f8fc]">
                          {paymentProofPreview ? (
                            <img
                              src={paymentProofPreview}
                              alt="Vista previa del comprobante"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <ImageIcon className="text-slate-400" size={40} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-lg font-black text-slate-950">
                            Comprobante seleccionado
                          </p>

                          <p className="mt-2 truncate text-sm font-bold text-slate-600">
                            {paymentProofFile.name}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {(paymentProofFile.size / 1024 / 1024).toFixed(2)} MB
                            · Se guardará de forma privada para validación del
                            admin.
                          </p>

                          <button
                            type="button"
                            onClick={clearPaymentProof}
                            disabled={submitting}
                            className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-xs font-black text-[#E31B23] transition hover:bg-red-100 disabled:opacity-60"
                          >
                            <X size={14} />
                            Quitar captura
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex gap-3 rounded-2xl bg-blue-50 p-4">
                    <ShieldCheck className="shrink-0 text-[#0057A8]" />

                    <p className="text-xs font-semibold leading-6 text-slate-600">
                      Sube una captura clara del pago por Yape. El comprobante se
                      guarda en un espacio privado y será revisado manualmente
                      por RCA IMPORT.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={18} />
                {uploadingProof
                  ? "Subiendo comprobante..."
                  : submitting
                  ? "Guardando reserva..."
                  : "Registrar reserva"}
              </button>
            </div>
          </form>

          <aside className="grid h-fit gap-5 lg:sticky lg:top-32">
            <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                  Resumen
                </p>

                <h2 className="mt-3 text-3xl font-black">
                  Productos a separar
                </h2>
              </div>

              <div className="grid gap-3 p-6">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div
                      key={`${item.slug}-${item.variant}`}
                      className="rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-black">{item.name}</p>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                                                        Color: {item.variant || "Color único"} · Cantidad:{" "}
                            {item.quantity}
                          </p>

                          <p className="mt-2 font-black text-[#0057A8]">
                            S/ {item.price * item.quantity}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.slug, item.variant)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-[#E31B23] transition hover:bg-[#E31B23] hover:text-white"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-[#f6f8fc] p-6 text-center">
                    <ShoppingBag className="mx-auto mb-4 text-slate-400" />

                    <p className="font-black">Tu carrito está vacío.</p>

                    <Link
                      href="/catalogo"
                      className="mt-4 inline-flex rounded-full bg-[#0057A8] px-5 py-3 text-sm font-black text-white"
                    >
                      Ver catálogo
                    </Link>
                  </div>
                )}
              </div>

              <div className="p-6 pt-0">
                <div className="rounded-[1.7rem] bg-slate-950 p-6 text-white">
                  <p className="text-sm font-bold text-slate-300">
                    Total aproximado
                  </p>

                  <p className="mt-2 text-5xl font-black">S/ {total}</p>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm font-semibold text-slate-300">
                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-xs text-slate-400">Productos</p>
                      <p className="mt-1 font-black text-white">{cart.length}</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-3">
                      <p className="text-xs text-slate-400">Unidades</p>
                      <p className="mt-1 font-black text-white">{totalUnits}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-200">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
                Importante
              </p>

              <div className="mt-5 grid gap-4">
                {[
                  "La reserva queda pendiente hasta validar el pago.",
                  "RCA IMPORT confirmará la operación por WhatsApp.",
                  "El comprobante se revisará manualmente.",
                  "La captura del pago se guarda de forma privada.",
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <BadgeCheck className="shrink-0 text-blue-300" />

                    <p className="text-sm font-semibold leading-6 text-slate-300">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:bg-slate-100"
              >
                <MessageCircle size={18} />
                Consultar por WhatsApp
              </a>
            </section>

            <section className="grid gap-3">
              {[
                {
                  icon: PackageCheck,
                  text: "Tu código de reserva aparecerá al finalizar.",
                },
                {
                  icon: Truck,
                  text: "El envío se coordina después de validar el pago.",
                },
                {
                  icon: LockKeyhole,
                  text: "El comprobante solo será visible para el administrador.",
                },
              ].map((item) => (
                <div
                  key={item.text}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex gap-3">
                    <item.icon className="shrink-0 text-[#0057A8]" />

                    <p className="text-sm font-semibold leading-6 text-slate-500">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </section>
          </aside>
        </section>
      </section>

      <SiteFooter />
    </main>
  );
}

function MiniStat({
  title,
  value,
  large = false,
}: {
  title: string;
  value: string | number;
  large?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur ${
        large ? "col-span-2" : ""
      }`}
    >
      <Sparkles className="text-blue-200" size={24} />

      <p className="mt-4 truncate text-3xl font-black">{value}</p>

      <p className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-300">
        {title}
      </p>
    </div>
  );
}

function FieldBlock({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-black text-slate-700">{label}</label>

      <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
        <Icon className="shrink-0 text-slate-400" size={19} />
        {children}
      </div>
    </div>
  );
}