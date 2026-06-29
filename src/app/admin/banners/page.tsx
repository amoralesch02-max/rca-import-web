"use client";

import AdminShell from "@/components/AdminShell";
import ConfirmModal from "@/components/ConfirmModal";
import {
  createSupabaseBanner,
  deleteSupabaseBanner,
  getSupabaseAdminBanners,
  type PublicBanner,
  updateSupabaseBanner,
} from "@/lib/supabase-banners";
import { supabase } from "@/lib/supabase";
import { uploadImageFile } from "@/lib/supabase-storage";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Filter,
  ImageIcon,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

export default function AdminBannersPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [banners, setBanners] = useState<PublicBanner[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [bannerToDelete, setBannerToDelete] = useState<PublicBanner | null>(
    null
  );
  const [deletingBanner, setDeletingBanner] = useState(false);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    label: "",
    buttonText: "Ver catálogo",
    buttonUrl: "/catalogo",
    imageUrl: "",
    isActive: true,
    position: "1",
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
      await loadBanners();
    }

    checkSessionAndLoad();
  }, [router]);

  async function loadBanners() {
    setLoading(true);
    setErrorMessage("");

    const supabaseBanners = await getSupabaseAdminBanners();

    setBanners(supabaseBanners);
    setLoading(false);
  }

  function resetForm() {
    setEditingId("");
    setErrorMessage("");

    setForm({
      title: "",
      subtitle: "",
      label: "",
      buttonText: "Ver catálogo",
      buttonUrl: "/catalogo",
      imageUrl: "",
      isActive: true,
      position: "1",
    });
  }

  function startEditing(banner: PublicBanner) {
    setEditingId(banner.id);
    setErrorMessage("");
    setSuccessMessage("");

    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      label: banner.label,
      buttonText: banner.buttonText,
      buttonUrl: banner.buttonUrl,
      imageUrl: banner.imageUrl,
      isActive: banner.isActive,
      position: String(banner.position),
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

    const result = await uploadImageFile(file, "banners");

    setUploadingImage(false);

    if (!result.success) {
      setErrorMessage(result.error || "No se pudo subir la imagen.");
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      imageUrl: result.url,
    }));

    setSuccessMessage("Imagen subida correctamente. Ahora guarda el banner.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!form.title.trim()) {
      setErrorMessage("Ingresa el título del banner.");
      return;
    }

    const positionNumber = Number(form.position);

    if (Number.isNaN(positionNumber) || positionNumber <= 0) {
      setErrorMessage("Ingresa una posición válida.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const result = await updateSupabaseBanner(editingId, {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        label: form.label.trim(),
        buttonText: form.buttonText.trim() || "Ver catálogo",
        buttonUrl: form.buttonUrl.trim() || "/catalogo",
        imageUrl: form.imageUrl.trim(),
        isActive: form.isActive,
        position: positionNumber,
      });

      setSaving(false);

      if (!result.success) {
        setErrorMessage("No se pudo actualizar el banner.");
        return;
      }

      setBanners((currentBanners) =>
        currentBanners
          .map((banner) =>
            banner.id === editingId
              ? {
                  ...banner,
                  title: form.title.trim(),
                  subtitle: form.subtitle.trim(),
                  label: form.label.trim(),
                  buttonText: form.buttonText.trim() || "Ver catálogo",
                  buttonUrl: form.buttonUrl.trim() || "/catalogo",
                  imageUrl: form.imageUrl.trim(),
                  isActive: form.isActive,
                  position: positionNumber,
                }
              : banner
          )
          .sort((a, b) => a.position - b.position)
      );

      resetForm();
      setSuccessMessage("Banner actualizado correctamente.");
      return;
    }

    const result = await createSupabaseBanner({
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      label: form.label.trim(),
      buttonText: form.buttonText.trim() || "Ver catálogo",
      buttonUrl: form.buttonUrl.trim() || "/catalogo",
      imageUrl: form.imageUrl.trim(),
      isActive: form.isActive,
      position: positionNumber,
    });

    setSaving(false);

    if (!result.success) {
      setErrorMessage("No se pudo crear el banner.");
      return;
    }

    await loadBanners();
    resetForm();
    setSuccessMessage("Banner creado correctamente.");
  }

  async function toggleBanner(banner: PublicBanner) {
    setUpdatingId(banner.id);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await updateSupabaseBanner(banner.id, {
      isActive: !banner.isActive,
    });

    if (!result.success) {
      setErrorMessage("No se pudo cambiar el estado del banner.");
      setUpdatingId("");
      return;
    }

    setBanners((currentBanners) =>
      currentBanners.map((currentBanner) =>
        currentBanner.id === banner.id
          ? { ...currentBanner, isActive: !banner.isActive }
          : currentBanner
      )
    );

    setUpdatingId("");
  }

  async function confirmDeleteBanner() {
    if (!bannerToDelete) return;

    setDeletingBanner(true);
    setUpdatingId(bannerToDelete.id);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await deleteSupabaseBanner(bannerToDelete.id);

    if (!result.success) {
      setErrorMessage("No se pudo eliminar el banner.");
      setUpdatingId("");
      setDeletingBanner(false);
      return;
    }

    setBanners((currentBanners) =>
      currentBanners.filter(
        (currentBanner) => currentBanner.id !== bannerToDelete.id
      )
    );

    if (editingId === bannerToDelete.id) {
      resetForm();
    }

    setBannerToDelete(null);
    setUpdatingId("");
    setDeletingBanner(false);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("Todos");
  }

  const filteredBanners = useMemo(() => {
    let result = [...banners];

    if (statusFilter === "Activos") {
      result = result.filter((banner) => banner.isActive);
    }

    if (statusFilter === "Inactivos") {
      result = result.filter((banner) => !banner.isActive);
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (banner) =>
          banner.title.toLowerCase().includes(query) ||
          banner.subtitle.toLowerCase().includes(query) ||
          banner.label.toLowerCase().includes(query) ||
          banner.buttonText.toLowerCase().includes(query) ||
          banner.buttonUrl.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => a.position - b.position);
  }, [banners, search, statusFilter]);

  const stats = useMemo(() => {
    const active = banners.filter((banner) => banner.isActive).length;
    const inactive = banners.filter((banner) => !banner.isActive).length;

    return {
      total: banners.length,
      active,
      inactive,
    };
  }, [banners]);

  const activeFilterCount = [
    Boolean(search.trim()),
    statusFilter !== "Todos",
  ].filter(Boolean).length;

  if (!ready) {
    return null;
  }

  return (
    <AdminShell
      title="Banners"
      description="Administra los banners del Home con imágenes subidas a Supabase Storage."
    >
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard
          title="Total"
          value={stats.total}
          icon={ImageIcon}
          color="text-[#0057A8]"
          bg="bg-blue-50"
        />

        <StatCard
          title="Activos"
          value={stats.active}
          icon={Eye}
          color="text-green-700"
          bg="bg-green-50"
        />

        <StatCard
          title="Inactivos"
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
            {editingId ? "Editar banner" : "Nuevo banner"}
          </p>

          <h2 className="mt-3 text-3xl font-black">
            {editingId ? "Actualizar Home" : "Crear banner"}
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Los banners activos aparecen en la portada según su posición.
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
              label="Etiqueta superior"
              value={form.label}
              onChange={(value) => setForm({ ...form, label: value })}
              placeholder="Ejemplo: Importaciones legales desde USA y China"
              icon={Sparkles}
            />

            <div>
              <label className="text-sm font-black text-slate-700">
                Título *
              </label>

              <textarea
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                rows={3}
                placeholder="Título principal del banner..."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-sm font-black text-slate-700">
                Subtítulo
              </label>

              <textarea
                value={form.subtitle}
                onChange={(event) =>
                  setForm({ ...form, subtitle: event.target.value })
                }
                rows={4}
                placeholder="Texto descriptivo del banner..."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InputField
                label="Texto botón"
                value={form.buttonText}
                onChange={(value) => setForm({ ...form, buttonText: value })}
                placeholder="Ver catálogo"
                icon={Link2}
              />

              <InputField
                label="URL botón"
                value={form.buttonUrl}
                onChange={(value) => setForm({ ...form, buttonUrl: value })}
                placeholder="/catalogo"
                icon={Link2}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <div>
                <label className="text-sm font-black text-slate-700">
                  Imagen del banner
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

              <InputField
                label="Posición"
                value={form.position}
                onChange={(value) => setForm({ ...form, position: value })}
                placeholder="1"
                type="number"
                icon={Filter}
              />
            </div>

            {form.imageUrl && (
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-3">
                <img
                  src={form.imageUrl}
                  alt="Vista previa del banner"
                  className="h-52 w-full rounded-[1.2rem] object-cover"
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
                  Banner activo
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
                : "Crear banner"}
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
                placeholder="Buscar banner, texto o URL..."
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
              <option>Activos</option>
              <option>Inactivos</option>
            </select>

            <button
              type="button"
              onClick={loadBanners}
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

                <p className="font-black">Cargando banners...</p>
              </div>
            ) : filteredBanners.length > 0 ? (
              filteredBanners.map((banner) => (
                <BannerCard
                  key={banner.id}
                  banner={banner}
                  updatingId={updatingId}
                  onEdit={startEditing}
                  onToggle={toggleBanner}
                  onDelete={setBannerToDelete}
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
              Storage conectado
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Ya puedes subir imágenes reales para los banners.
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
              Las imágenes se guardan en Supabase Storage dentro del bucket
              rca-images y se muestran en el Home si el banner está activo.
            </p>
          </div>

          <Sparkles className="text-blue-300" size={52} />
        </div>
      </section>

      <ConfirmModal
        open={Boolean(bannerToDelete)}
        title="Eliminar banner"
        description={`¿Seguro que deseas eliminar el banner "${
          bannerToDelete?.title ?? ""
        }"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        loading={deletingBanner}
        danger
        onCancel={() => setBannerToDelete(null)}
        onConfirm={confirmDeleteBanner}
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
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}

function BannerCard({
  banner,
  updatingId,
  onEdit,
  onToggle,
  onDelete,
}: {
  banner: PublicBanner;
  updatingId: string;
  onEdit: (banner: PublicBanner) => void;
  onToggle: (banner: PublicBanner) => void;
  onDelete: (banner: PublicBanner) => void;
}) {
  const isUpdating = updatingId === banner.id;

  return (
    <article className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-sm">
      {banner.imageUrl ? (
        <img
          src={banner.imageUrl}
          alt={banner.title}
          className="h-52 w-full object-cover"
        />
      ) : (
        <div className="flex h-52 items-center justify-center bg-[#f6f8fc]">
          <ImageIcon className="text-slate-400" size={48} />
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge isActive={banner.isActive} />

          <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#0057A8]">
            Posición {banner.position}
          </span>
        </div>

        <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-[#E31B23]">
          {banner.label || "Sin etiqueta"}
        </p>

        <h3 className="mt-2 text-2xl font-black leading-tight text-slate-950">
          {banner.title}
        </h3>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">
          {banner.subtitle || "Sin subtítulo"}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
          <span className="rounded-full bg-[#f6f8fc] px-3 py-2 text-slate-600">
            Botón: {banner.buttonText || "Ver catálogo"}
          </span>

          <span className="rounded-full bg-[#f6f8fc] px-3 py-2 text-slate-600">
            URL: {banner.buttonUrl || "/catalogo"}
          </span>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0057A8] px-4 py-3 text-xs font-black text-white transition hover:bg-blue-700"
          >
            <Eye size={16} />
            Ver Home
          </Link>

          <button
            type="button"
            onClick={() => onEdit(banner)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
          >
            <Pencil size={16} />
            Editar
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onToggle(banner)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {banner.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
            {banner.isActive ? "Desactivar" : "Activar"}
          </button>

          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onDelete(banner)}
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
      <ImageIcon className="mx-auto mb-4 text-slate-400" size={46} />

      <p className="text-2xl font-black">No hay banners encontrados.</p>

      <p className="mt-2 text-sm font-semibold text-slate-500">
        Crea un nuevo banner desde el formulario.
      </p>
    </div>
  );
}