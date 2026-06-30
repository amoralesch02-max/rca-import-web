"use client";

import AdminShell from "@/components/AdminShell";
import ConfirmModal from "@/components/ConfirmModal";
import {
  createSupabaseDelivery,
  deleteSupabaseDelivery,
  getSupabaseAdminDeliveries,
  type PublicDelivery,
  updateSupabaseDelivery,
} from "@/lib/supabase-deliveries";
import { supabase } from "@/lib/supabase";
import { uploadImageFile } from "@/lib/supabase-storage";
import {
  BadgeCheck,
  CalendarDays,
  Eye,
  EyeOff,
  Filter,
  Gift,
  ImageIcon,
  MapPin,
  PackageCheck,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date: string) {
  if (!date) {
    return "Sin fecha";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function AdminDeliveriesPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [deliveries, setDeliveries] = useState<PublicDelivery[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todas");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [deliveryToDelete, setDeliveryToDelete] =
    useState<PublicDelivery | null>(null);
  const [deletingDelivery, setDeletingDelivery] = useState(false);

  const [form, setForm] = useState({
    title: "",
    customerName: "Cliente RCA",
    productName: "",
    city: "Tacna",
    description: "",
    imageUrl: "",
    deliveredAt: getTodayDate(),
    position: "1",
    isActive: true,
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
      await loadDeliveries();
    }

    checkSessionAndLoad();
  }, [router]);

  async function loadDeliveries() {
    setLoading(true);
    setErrorMessage("");

    const supabaseDeliveries = await getSupabaseAdminDeliveries();

    setDeliveries(supabaseDeliveries);
    setLoading(false);
  }

  function resetForm() {
    setEditingId("");
    setErrorMessage("");
    setSuccessMessage("");

    setForm({
      title: "",
      customerName: "Cliente RCA",
      productName: "",
      city: "Tacna",
      description: "",
      imageUrl: "",
      deliveredAt: getTodayDate(),
      position: "1",
      isActive: true,
    });
  }

  function startEditing(delivery: PublicDelivery) {
    setEditingId(delivery.id);
    setErrorMessage("");
    setSuccessMessage("");

    setForm({
      title: delivery.title,
      customerName: delivery.customerName,
      productName: delivery.productName,
      city: delivery.city,
      description: delivery.description,
      imageUrl: delivery.imageUrl,
      deliveredAt: delivery.deliveredAt || getTodayDate(),
      position: String(delivery.position),
      isActive: delivery.isActive,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleImageUpload(file: File | null) {
    if (!file) return;

    setUploadingImage(true);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await uploadImageFile(file, "entregas");

    setUploadingImage(false);

    if (!result.success) {
      setErrorMessage(result.error || "No se pudo subir la imagen.");
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      imageUrl: result.url,
    }));

    setSuccessMessage("Imagen subida correctamente. Ahora guarda la entrega.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!form.title.trim()) {
      setErrorMessage("Ingresa el título de la entrega.");
      return;
    }

    if (!form.productName.trim()) {
      setErrorMessage("Ingresa el producto entregado.");
      return;
    }

    if (!form.city.trim()) {
      setErrorMessage("Ingresa la ciudad de entrega.");
      return;
    }

    const positionNumber = Number(form.position);

    if (Number.isNaN(positionNumber) || positionNumber <= 0) {
      setErrorMessage("Ingresa una posición válida.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const result = await updateSupabaseDelivery(editingId, {
        title: form.title.trim(),
        customerName: form.customerName.trim() || "Cliente RCA",
        productName: form.productName.trim(),
        city: form.city.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        deliveredAt: form.deliveredAt,
        position: positionNumber,
        isActive: form.isActive,
      });

      setSaving(false);

      if (!result.success) {
        setErrorMessage("No se pudo actualizar la entrega.");
        return;
      }

      setDeliveries((currentDeliveries) =>
        currentDeliveries
          .map((delivery) =>
            delivery.id === editingId
              ? {
                  ...delivery,
                  title: form.title.trim(),
                  customerName: form.customerName.trim() || "Cliente RCA",
                  productName: form.productName.trim(),
                  city: form.city.trim(),
                  description: form.description.trim(),
                  imageUrl: form.imageUrl.trim(),
                  deliveredAt: form.deliveredAt,
                  position: positionNumber,
                  isActive: form.isActive,
                }
              : delivery
          )
          .sort((a, b) => a.position - b.position)
      );

      resetForm();
      setSuccessMessage("Entrega actualizada correctamente.");
      return;
    }

    const result = await createSupabaseDelivery({
      title: form.title.trim(),
      customerName: form.customerName.trim() || "Cliente RCA",
      productName: form.productName.trim(),
      city: form.city.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim(),
      deliveredAt: form.deliveredAt,
      position: positionNumber,
      isActive: form.isActive,
    });

    setSaving(false);

    if (!result.success) {
      setErrorMessage("No se pudo crear la entrega.");
      return;
    }

    await loadDeliveries();
    resetForm();
    setSuccessMessage("Entrega creada correctamente.");
  }

  async function toggleDelivery(delivery: PublicDelivery) {
    setUpdatingId(delivery.id);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await updateSupabaseDelivery(delivery.id, {
      isActive: !delivery.isActive,
    });

    if (!result.success) {
      setErrorMessage("No se pudo cambiar el estado de la entrega.");
      setUpdatingId("");
      return;
    }

    setDeliveries((currentDeliveries) =>
      currentDeliveries.map((currentDelivery) =>
        currentDelivery.id === delivery.id
          ? { ...currentDelivery, isActive: !delivery.isActive }
          : currentDelivery
      )
    );

    setUpdatingId("");
  }

  async function confirmDeleteDelivery() {
    if (!deliveryToDelete) return;

    setDeletingDelivery(true);
    setUpdatingId(deliveryToDelete.id);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await deleteSupabaseDelivery(deliveryToDelete.id);

    if (!result.success) {
      setErrorMessage("No se pudo eliminar la entrega.");
      setUpdatingId("");
      setDeletingDelivery(false);
      return;
    }

    setDeliveries((currentDeliveries) =>
      currentDeliveries.filter(
        (currentDelivery) => currentDelivery.id !== deliveryToDelete.id
      )
    );

    if (editingId === deliveryToDelete.id) {
      resetForm();
    }

    setDeliveryToDelete(null);
    setUpdatingId("");
    setDeletingDelivery(false);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("Todas");
  }

  const filteredDeliveries = useMemo(() => {
    let result = [...deliveries];

    if (statusFilter === "Activas") {
      result = result.filter((delivery) => delivery.isActive);
    }

    if (statusFilter === "Inactivas") {
      result = result.filter((delivery) => !delivery.isActive);
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (delivery) =>
          delivery.title.toLowerCase().includes(query) ||
          delivery.customerName.toLowerCase().includes(query) ||
          delivery.productName.toLowerCase().includes(query) ||
          delivery.city.toLowerCase().includes(query) ||
          delivery.description.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => a.position - b.position);
  }, [deliveries, search, statusFilter]);

  const stats = useMemo(() => {
    const active = deliveries.filter((delivery) => delivery.isActive).length;
    const inactive = deliveries.filter((delivery) => !delivery.isActive).length;

    return {
      total: deliveries.length,
      active,
      inactive,
    };
  }, [deliveries]);

  const activeFilterCount = [
    Boolean(search.trim()),
    statusFilter !== "Todas",
  ].filter(Boolean).length;

  if (!ready) {
    return null;
  }

  return (
    <AdminShell
      title="Entregas"
      description="Administra las entregas reales y clientes satisfechos que aparecerán en la web pública."
    >
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard
          title="Total"
          value={stats.total}
          icon={PackageCheck}
          color="text-[#0057A8]"
          bg="bg-blue-50"
        />

        <StatCard
          title="Activas"
          value={stats.active}
          icon={Eye}
          color="text-green-700"
          bg="bg-green-50"
        />

        <StatCard
          title="Inactivas"
          value={stats.inactive}
          icon={EyeOff}
          color="text-[#E31B23]"
          bg="bg-red-50"
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.52fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
            {editingId ? "Editar entrega" : "Nueva entrega"}
          </p>

          <h2 className="mt-3 text-3xl font-black">
            {editingId ? "Actualizar experiencia" : "Agregar entrega"}
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Estas publicaciones se mostrarán como prueba visual de confianza
            para los clientes.
          </p>

          {errorMessage && (
            <div className="mt-5 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-[#E31B23]">
              <XCircle className="shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mt-5 flex gap-3 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
              <BadgeCheck className="shrink-0" />
              <p>{successMessage}</p>
            </div>
          )}

          <div className="mt-6 grid gap-4">
            <InputField
              label="Título *"
              value={form.title}
              onChange={(value) => setForm({ ...form, title: value })}
              placeholder="Ejemplo: iPhone 15 Pro entregado"
              icon={Sparkles}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Cliente"
                value={form.customerName}
                onChange={(value) =>
                  setForm({ ...form, customerName: value })
                }
                placeholder="Cliente RCA"
                icon={UserRound}
              />

              <InputField
                label="Ciudad *"
                value={form.city}
                onChange={(value) => setForm({ ...form, city: value })}
                placeholder="Tacna"
                icon={MapPin}
              />
            </div>

            <InputField
              label="Producto entregado *"
              value={form.productName}
              onChange={(value) => setForm({ ...form, productName: value })}
              placeholder="iPhone 15 Pro Max 256GB"
              icon={Gift}
            />

            <div>
              <label className="text-sm font-black text-slate-700">
                Descripción
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                rows={4}
                placeholder="Ejemplo: Entrega realizada con coordinación directa y producto verificado."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <InputField
                label="Fecha de entrega"
                value={form.deliveredAt}
                onChange={(value) =>
                  setForm({ ...form, deliveredAt: value })
                }
                type="date"
                icon={CalendarDays}
              />

              <InputField
                label="Posición"
                value={form.position}
                onChange={(value) => setForm({ ...form, position: value })}
                type="number"
                placeholder="1"
                icon={Filter}
              />
            </div>

            <div>
              <label className="text-sm font-black text-slate-700">
                Imagen de entrega
              </label>

              <div className="mt-2 grid gap-3">
                <input
                  value={form.imageUrl}
                  onChange={(event) =>
                    setForm({ ...form, imageUrl: event.target.value })
                  }
                  placeholder="URL de imagen o sube una desde tu PC"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
                />

                <label className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800">
                  <Upload size={18} />
                  {uploadingImage ? "Subiendo..." : "Subir imagen"}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(event) => {
                      handleImageUpload(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>

            {form.imageUrl && (
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-3">
                <img
                  src={form.imageUrl}
                  alt="Vista previa de entrega"
                  className="h-64 w-full rounded-[1.2rem] object-cover"
                />
              </div>
            )}

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-[#f6f8fc] p-4 transition hover:bg-slate-100">
              <div className="flex items-center gap-3">
                <BadgeCheck
                  className={
                    form.isActive ? "text-[#0057A8]" : "text-slate-300"
                  }
                  size={20}
                />

                <p className="text-sm font-black text-slate-700">
                  Mostrar en la web
                </p>
              </div>

              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm({ ...form, isActive: event.target.checked })
                }
                className="h-5 w-5 accent-[#0057A8]"
              />
            </label>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {saving
                ? "Guardando..."
                : editingId
                ? "Guardar cambios"
                : "Agregar entrega"}
            </button>

            <button
              type="button"
              onClick={resetForm}
              className="h-14 rounded-2xl bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-200"
            >
              {editingId ? "Cancelar edición" : "Limpiar"}
            </button>
          </div>
        </form>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 xl:grid-cols-[1fr_170px_160px]">
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
              <Search className="shrink-0 text-slate-400" size={20} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar entrega, cliente, producto o ciudad..."
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
              <option>Todas</option>
              <option>Activas</option>
              <option>Inactivas</option>
            </select>

            <button
              type="button"
              onClick={loadDeliveries}
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

          <div className="mt-5 grid gap-4">
            {loading ? (
              <div className="rounded-[1.5rem] border border-slate-200 p-10 text-center">
                <RefreshCw
                  className="mx-auto mb-4 animate-spin text-[#0057A8]"
                  size={42}
                />

                <p className="font-black">Cargando entregas...</p>
              </div>
            ) : filteredDeliveries.length > 0 ? (
              filteredDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  updatingId={updatingId}
                  onEdit={startEditing}
                  onToggle={toggleDelivery}
                  onDelete={setDeliveryToDelete}
                />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </section>

      <section className="mt-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-200">
        <div className="grid gap-6 md:grid-cols-[1fr_0.35fr] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
              Confianza visual
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Las entregas activas aparecerán en la web pública.
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
              Usa imágenes reales de productos entregados para generar más
              confianza en los clientes que visitan RCA IMPORT.
            </p>
          </div>

          <PackageCheck className="text-blue-300" size={52} />
        </div>
      </section>

      <ConfirmModal
        open={Boolean(deliveryToDelete)}
        title="Eliminar entrega"
        description={`¿Seguro que deseas eliminar "${
          deliveryToDelete?.title ?? ""
        }"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        loading={deletingDelivery}
        danger
        onCancel={() => setDeliveryToDelete(null)}
        onConfirm={confirmDeleteDelivery}
      />
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
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
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

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  icon: LucideIcon;
}) {
  return (
    <div>
      <label className="text-sm font-black text-slate-700">{label}</label>

      <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
        <Icon className="shrink-0 text-slate-400" size={20} />

        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          min={type === "number" ? "1" : undefined}
          className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${
        isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-[#E31B23]"
      }`}
    >
      {isActive ? <Eye size={15} /> : <EyeOff size={15} />}
      {isActive ? "Activa" : "Inactiva"}
    </span>
  );
}

function DeliveryCard({
  delivery,
  updatingId,
  onEdit,
  onToggle,
  onDelete,
}: {
  delivery: PublicDelivery;
  updatingId: string;
  onEdit: (delivery: PublicDelivery) => void;
  onToggle: (delivery: PublicDelivery) => void;
  onDelete: (delivery: PublicDelivery) => void;
}) {
  const isUpdating = updatingId === delivery.id;

  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
      {delivery.imageUrl ? (
        <img
          src={delivery.imageUrl}
          alt={delivery.title}
          className="h-64 w-full object-cover"
        />
      ) : (
        <div className="flex h-64 items-center justify-center bg-[#f6f8fc]">
          <ImageIcon className="text-slate-400" size={48} />
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge isActive={delivery.isActive} />

          <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#0057A8]">
            Posición {delivery.position}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
            {formatDate(delivery.deliveredAt)}
          </span>
        </div>

        <h3 className="mt-4 text-2xl font-black leading-tight text-slate-950">
          {delivery.title}
        </h3>

        <p className="mt-2 text-sm font-black text-[#E31B23]">
          {delivery.productName}
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-[#f6f8fc] px-3 py-2 text-slate-600">
            Cliente: {delivery.customerName}
          </span>

          <span className="rounded-full bg-[#f6f8fc] px-3 py-2 text-slate-600">
            Ciudad: {delivery.city}
          </span>
        </div>

        <p className="mt-4 text-sm font-semibold leading-6 text-slate-500">
          {delivery.description || "Sin descripción"}
        </p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => onEdit(delivery)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
          >
            <Pencil size={16} />
            Editar
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onToggle(delivery)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {delivery.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
            {delivery.isActive ? "Desactivar" : "Activar"}
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onDelete(delivery)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E31B23] px-4 py-3 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={16} />
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 p-10 text-center">
      <PackageCheck className="mx-auto mb-4 text-slate-400" size={46} />

      <p className="text-2xl font-black">No hay entregas registradas.</p>

      <p className="mt-2 text-sm font-semibold text-slate-500">
        Agrega una nueva entrega desde el formulario.
      </p>
    </div>
  );
}