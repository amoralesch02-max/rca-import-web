"use client";

import ProductImage from "@/components/ProductImage";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  DEFAULT_STORE_SETTINGS,
  getWhatsappUrl,
  type StoreSettings,
} from "@/lib/store-settings";
import { getSupabaseProducts } from "@/lib/supabase-products";
import { getSupabaseStoreSettings } from "@/lib/supabase-settings";
import {
  createSupabaseReservation,
  type ReservationCartItem,
} from "@/lib/supabase-reservations";
import { uploadPaymentProofFile } from "@/lib/supabase-storage";
import {
  AlertCircle,
  BadgeCheck,
  ChevronRight,
  ClipboardCheck,
  FileText,
  ImageIcon,
  LockKeyhole,
  MapPin,
  Send,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  UploadCloud,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Link from "next/link";
import { type ComponentType, useEffect, useMemo, useState } from "react";
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
  const [images, setImages] = useState<Record<string, string>>({});
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

    // El carrito guardado no incluye fotos: se buscan por slug (solo visual)
    async function loadImages() {
      const products = await getSupabaseProducts();
      const map: Record<string, string> = {};

      products.forEach((product) => {
        if (product.imageUrl) {
          map[product.slug] = product.imageUrl;
        }
      });

      setImages(map);
    }

    loadSettings();
    loadImages();
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
    <main className="min-h-screen bg-bg text-slate-950">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-8 md:px-6 md:py-10">
        {/* Migas de pan */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="transition hover:text-brand">
            Inicio
          </Link>

          <ChevronRight size={13} className="text-slate-300" />

          <Link href="/carrito" className="transition hover:text-brand">
            Carrito
          </Link>

          <ChevronRight size={13} className="text-slate-300" />

          <span className="text-slate-700">Separar</span>
        </nav>

        <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">
          Separar productos
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Completa tus datos, sube la captura del pago por Yape y RCA IMPORT
          validará tu reserva.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
          {/* ================= FORMULARIO ================= */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-line bg-white p-6 md:p-8"
          >
            {errorMessage && (
              <div className="mb-6 flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-alert">
                <AlertCircle className="shrink-0" size={18} />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Paso 1 */}
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                1
              </span>
              <h2 className="text-lg font-bold">Tus datos</h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Estos datos ayudan a identificar tu reserva y coordinar la entrega
              o el envío.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FieldBlock label="Nombre completo *" icon={UserRound}>
                <input
                  value={form.customerName}
                  onChange={(event) =>
                    setForm({ ...form, customerName: event.target.value })
                  }
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Ejemplo: Alisson Morales"
                />
              </FieldBlock>

              <FieldBlock label="DNI / Documento *" icon={FileText}>
                <input
                  value={form.documentNumber}
                  onChange={(event) =>
                    setForm({ ...form, documentNumber: event.target.value })
                  }
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Ejemplo: 12345678"
                />
              </FieldBlock>

              <FieldBlock label="Celular *" icon={WhatsAppIcon}>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Ejemplo: 999 999 999"
                />
              </FieldBlock>

              <FieldBlock label="Tipo de operación" icon={ClipboardCheck}>
                <select
                  value={form.operationType}
                  onChange={(event) =>
                    setForm({ ...form, operationType: event.target.value })
                  }
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400 font-medium"
                >
                  <option>Separación con adelanto</option>
                  <option>Compra completa</option>
                  <option>Consulta para mayorista</option>
                </select>
              </FieldBlock>

              <FieldBlock label="Departamento *" icon={MapPin}>
                <input
                  value={form.department}
                  onChange={(event) =>
                    setForm({ ...form, department: event.target.value })
                  }
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Ejemplo: Tacna"
                />
              </FieldBlock>

              <FieldBlock label="Ciudad *" icon={Truck}>
                <input
                  value={form.city}
                  onChange={(event) =>
                    setForm({ ...form, city: event.target.value })
                  }
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder="Ejemplo: Tacna"
                />
              </FieldBlock>

              <div className="md:col-span-2">
                <FieldBlock label="Dirección *" icon={MapPin}>
                  <input
                    value={form.address}
                    onChange={(event) =>
                      setForm({ ...form, address: event.target.value })
                    }
                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Dirección para envío o referencia"
                  />
                </FieldBlock>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="mt-10 flex items-center gap-3 border-t border-line pt-8">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                2
              </span>
              <h2 className="text-lg font-bold">Pago por Yape</h2>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-xl bg-slate-950 p-5 text-white md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-200">
                  <Wallet size={22} />
                </div>

                <div>
                  <p className="text-sm font-semibold">Yape · pago manual</p>
                  <p className="mt-0.5 text-sm text-slate-300">
                    {settings.yapeNumber} · {settings.yapeOwner}
                  </p>
                </div>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-200">
                <LockKeyhole size={14} />
                Comprobante privado
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Monto pagado *
                </label>

                <div className="mt-1.5 flex h-11 items-center rounded-xl border border-line bg-bg px-4 transition focus-within:border-brand focus-within:bg-white">
                  <span className="mr-2 text-sm font-semibold text-slate-400">
                    S/
                  </span>

                  <input
                    value={form.amountPaid}
                    onChange={(event) =>
                      setForm({ ...form, amountPaid: event.target.value })
                    }
                    type="number"
                    min={minimumReservationAmount}
                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder={`Ejemplo: ${minimumReservationAmount}`}
                  />
                </div>

                <div className="mt-2 grid gap-1">
                  <p className="text-xs font-semibold text-alert">
                    {minimumReservationMessage}
                  </p>

                  <p className="text-xs text-slate-500">
                    Saldo aproximado pendiente: S/ {pendingAmount}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">
                  Captura del comprobante *
                </label>

                <label className="mt-1.5 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand bg-blue-50 px-4 text-sm font-semibold text-brand transition hover:bg-blue-100">
                  <UploadCloud size={18} />
                  {paymentProofFile ? "Cambiar captura" : "Subir captura"}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    disabled={submitting}
                    onChange={(event) => {
                      handlePaymentProofChange(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            {paymentProofFile && (
              <div className="mt-5 grid gap-4 rounded-xl border border-line p-4 md:grid-cols-[150px_1fr] md:items-center">
                <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg bg-bg">
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
                  <p className="text-sm font-semibold">
                    Comprobante seleccionado
                  </p>

                  <p className="mt-1 truncate text-sm text-slate-600">
                    {paymentProofFile.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {(paymentProofFile.size / 1024 / 1024).toFixed(2)} MB · Se
                    guardará de forma privada para validación del admin.
                  </p>

                  <button
                    type="button"
                    onClick={clearPaymentProof}
                    disabled={submitting}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-alert transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X size={13} />
                    Quitar captura
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3 rounded-xl bg-blue-50 p-4">
              <ShieldCheck className="mt-0.5 shrink-0 text-brand" size={18} />

              <p className="text-xs leading-5 text-slate-600">
                Sube una captura clara del pago por Yape. El comprobante se
                guarda en un espacio privado y será revisado manualmente por RCA
                IMPORT.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} />
              {uploadingProof
                ? "Subiendo comprobante..."
                : submitting
                ? "Guardando reserva..."
                : "Registrar reserva"}
            </button>
          </form>

          {/* ================= RESUMEN ================= */}
          <aside className="grid gap-5 lg:sticky lg:top-28">
            <section className="rounded-2xl border border-line bg-white p-6">
              <h2 className="text-lg font-bold">Productos a separar</h2>

              <div className="mt-4 grid gap-3">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div
                      key={`${item.slug}-${item.variant}`}
                      className="flex gap-3 rounded-xl border border-line p-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                        <ProductImage
                          src={images[item.slug]}
                          alt={item.name}
                          sizes="64px"
                          className="h-full w-full"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug">
                          {item.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {item.variant || "Color único"} · Cantidad:{" "}
                          {item.quantity}
                        </p>

                        <p className="mt-1 text-sm font-bold text-brand">
                          S/ {item.price * item.quantity}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.slug, item.variant)}
                        aria-label={`Quitar ${item.name}`}
                        className="h-fit shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-alert"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl bg-bg p-6 text-center">
                    <ShoppingBag
                      className="mx-auto mb-3 text-slate-400"
                      size={30}
                    />

                    <p className="text-sm font-semibold">
                      Tu carrito está vacío.
                    </p>

                    <Link
                      href="/catalogo"
                      className="mt-4 inline-flex rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
                    >
                      Ver catálogo
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-line pt-5">
                <div className="flex items-end justify-between gap-3">
                  <span className="text-sm font-semibold">
                    Total aproximado
                  </span>
                  <span className="text-3xl font-bold">S/ {total}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-bg p-3">
                    <p className="text-xs text-slate-500">Productos</p>
                    <p className="mt-0.5 font-bold">{cart.length}</p>
                  </div>

                  <div className="rounded-lg bg-bg p-3">
                    <p className="text-xs text-slate-500">Unidades</p>
                    <p className="mt-0.5 font-bold">{totalUnits}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-slate-950 p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                Importante
              </p>

              <ul className="mt-4 grid gap-3">
                {[
                  "La reserva queda pendiente hasta validar el pago.",
                  "RCA IMPORT confirmará la operación por WhatsApp.",
                  "El comprobante se revisa manualmente y solo lo ve el administrador.",
                  "Tu código de reserva aparecerá al finalizar.",
                  "El envío se coordina después de validar el pago.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <BadgeCheck
                      className="mt-0.5 shrink-0 text-blue-300"
                      size={18}
                    />

                    <span className="text-sm leading-6 text-slate-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                <WhatsAppIcon size={17} />
                Consultar por WhatsApp
              </a>
            </section>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

function FieldBlock({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-600">{label}</label>

      <div className="mt-1.5 flex h-11 items-center gap-3 rounded-xl border border-line bg-bg px-4 transition focus-within:border-brand focus-within:bg-white">
        <Icon size={17} className="shrink-0 text-slate-400" />

        {children}
      </div>
    </div>
  );
}
