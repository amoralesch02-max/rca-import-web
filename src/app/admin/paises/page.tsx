"use client";

import AdminShell from "@/components/AdminShell";
import ConfirmModal from "@/components/ConfirmModal";
import { supabase } from "@/lib/supabase";
import {
  createSupabaseCountry,
  deleteSupabaseCountry,
  getSupabaseAdminCountries,
  type PublicCountry,
  updateSupabaseCountry,
} from "@/lib/supabase-taxonomies";
import {
  BadgeCheck,
  Eye,
  EyeOff,
  Filter,
  Globe2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function AdminCountriesPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [countryToDelete, setCountryToDelete] =
    useState<PublicCountry | null>(null);
  const [deletingCountry, setDeletingCountry] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    flag: "",
    description: "",
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
      await loadCountries();
    }

    checkSessionAndLoad();
  }, [router]);

  async function loadCountries() {
    setLoading(true);
    setErrorMessage("");

    const supabaseCountries = await getSupabaseAdminCountries();

    setCountries(supabaseCountries);
    setLoading(false);
  }

  function resetForm() {
    setEditingId("");
    setErrorMessage("");

    setForm({
      name: "",
      slug: "",
      flag: "",
      description: "",
      isActive: true,
    });
  }

  function startEditing(country: PublicCountry) {
    setEditingId(country.id);
    setErrorMessage("");

    setForm({
      name: country.name,
      slug: country.slug,
      flag: country.flag || "",
      description: country.description || "",
      isActive: country.isActive,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!form.name.trim()) {
      setErrorMessage("Ingresa el nombre del país.");
      return;
    }

    const finalSlug = form.slug.trim()
      ? generateSlug(form.slug)
      : generateSlug(form.name);

    if (!finalSlug) {
      setErrorMessage("El país necesita un slug válido.");
      return;
    }

    setSaving(true);

    if (editingId) {
      const result = await updateSupabaseCountry(editingId, {
        name: form.name.trim(),
        slug: finalSlug,
        flag: form.flag.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
      });

      setSaving(false);

      if (!result.success) {
        setErrorMessage(
          result.error?.includes("duplicate key")
            ? "Ya existe un país con ese slug."
            : "No se pudo actualizar el país."
        );
        return;
      }

      setCountries((currentCountries) =>
        currentCountries.map((country) =>
          country.id === editingId
            ? {
                ...country,
                name: form.name.trim(),
                slug: finalSlug,
                flag: form.flag.trim(),
                description: form.description.trim(),
                isActive: form.isActive,
              }
            : country
        )
      );

      resetForm();
      return;
    }

    const result = await createSupabaseCountry({
      name: form.name.trim(),
      slug: finalSlug,
      flag: form.flag.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
    });

    setSaving(false);

    if (!result.success) {
      setErrorMessage(
        result.error?.includes("duplicate key")
          ? "Ya existe un país con ese slug."
          : "No se pudo crear el país."
      );
      return;
    }

    await loadCountries();
    resetForm();
  }

  async function toggleCountry(country: PublicCountry) {
    setUpdatingId(country.id);
    setErrorMessage("");

    const result = await updateSupabaseCountry(country.id, {
      isActive: !country.isActive,
    });

    if (!result.success) {
      setErrorMessage("No se pudo cambiar el estado del país.");
      setUpdatingId("");
      return;
    }

    setCountries((currentCountries) =>
      currentCountries.map((currentCountry) =>
        currentCountry.id === country.id
          ? { ...currentCountry, isActive: !country.isActive }
          : currentCountry
      )
    );

    setUpdatingId("");
  }

  async function confirmDeleteCountry() {
    if (!countryToDelete) return;

    setDeletingCountry(true);
    setUpdatingId(countryToDelete.id);
    setErrorMessage("");

    const result = await deleteSupabaseCountry(countryToDelete.id);

    if (!result.success) {
      setErrorMessage(
        "No se pudo eliminar el país. Puede estar relacionado con productos existentes."
      );
      setUpdatingId("");
      setDeletingCountry(false);
      return;
    }

    setCountries((currentCountries) =>
      currentCountries.filter(
        (currentCountry) => currentCountry.id !== countryToDelete.id
      )
    );

    if (editingId === countryToDelete.id) {
      resetForm();
    }

    setCountryToDelete(null);
    setUpdatingId("");
    setDeletingCountry(false);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("Todos");
  }

  const filteredCountries = useMemo(() => {
    let result = [...countries];

    if (statusFilter === "Activos") {
      result = result.filter((country) => country.isActive);
    }

    if (statusFilter === "Inactivos") {
      result = result.filter((country) => !country.isActive);
    }

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (country) =>
          country.name.toLowerCase().includes(query) ||
          country.slug.toLowerCase().includes(query) ||
          (country.description || "").toLowerCase().includes(query) ||
          (country.flag || "").toLowerCase().includes(query)
      );
    }

    return result;
  }, [countries, search, statusFilter]);

  const stats = useMemo(() => {
    const active = countries.filter((country) => country.isActive).length;
    const inactive = countries.filter((country) => !country.isActive).length;

    return {
      total: countries.length,
      active,
      inactive,
    };
  }, [countries]);

  const activeFilterCount = [
    Boolean(search.trim()),
    statusFilter !== "Todos",
  ].filter(Boolean).length;

  if (!ready) {
    return null;
  }

  return (
    <AdminShell
      title="Países"
      description="Administra los países de importación reales desde Supabase."
    >
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard
          title="Total"
          value={stats.total}
          icon={Globe2}
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

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.48fr_1fr]">
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
            {editingId ? "Editar país" : "Nuevo país"}
          </p>

          <h2 className="mt-3 text-3xl font-black">
            {editingId ? "Actualizar datos" : "Crear país"}
          </h2>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            Los países activos aparecerán en el catálogo público y en el
            formulario de productos.
          </p>

          {errorMessage && (
            <div className="mt-5 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-[#E31B23]">
              <XCircle className="shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="mt-6 grid gap-4">
            <InputField
              label="Nombre *"
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
              placeholder="Ejemplo: USA"
              icon={Globe2}
            />

            <InputField
              label="Slug"
              value={form.slug}
              onChange={(value) => setForm({ ...form, slug: value })}
              placeholder="Se genera automático si lo dejas vacío"
              icon={Filter}
            />

            <InputField
              label="Bandera"
              value={form.flag}
              onChange={(value) => setForm({ ...form, flag: value })}
              placeholder="Ejemplo: 🇺🇸"
              icon={Globe2}
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
                rows={5}
                placeholder="Describe el país de importación o tipo de productos..."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
              />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-[#f6f8fc] p-4 transition hover:bg-slate-100">
              <div className="flex items-center gap-3">
                <BadgeCheck
                  className={
                    form.isActive ? "text-[#0057A8]" : "text-slate-300"
                  }
                  size={20}
                />

                <p className="text-sm font-black text-slate-700">
                  País activo
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
              disabled={saving}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {saving
                ? "Guardando..."
                : editingId
                ? "Guardar cambios"
                : "Crear país"}
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
          <div className="grid gap-4 xl:grid-cols-[1fr_190px_160px]">
            <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
              <Search className="shrink-0 text-slate-400" size={20} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar país, slug, bandera o descripción..."
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
              onClick={loadCountries}
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

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
            {loading ? (
              <div className="p-10 text-center">
                <RefreshCw
                  className="mx-auto mb-4 animate-spin text-[#0057A8]"
                  size={42}
                />

                <p className="font-black">Cargando países...</p>
              </div>
            ) : filteredCountries.length > 0 ? (
              <>
                <div className="grid gap-4 p-4 xl:hidden">
                  {filteredCountries.map((country) => (
                    <CountryMobileCard
                      key={country.id}
                      country={country}
                      updatingId={updatingId}
                      onEdit={startEditing}
                      onToggle={toggleCountry}
                      onDelete={setCountryToDelete}
                    />
                  ))}
                </div>

                <div className="hidden overflow-x-auto xl:block">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em]">
                          País
                        </th>

                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em]">
                          Estado
                        </th>

                        <th className="px-5 py-4 text-xs font-black uppercase tracking-[0.16em]">
                          Acciones
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCountries.map((country) => (
                        <tr
                          key={country.id}
                          className="border-b border-slate-200 last:border-b-0"
                        >
                          <td className="min-w-[360px] px-5 py-5 align-top">
                            <CountryInfo country={country} />
                          </td>

                          <td className="min-w-[150px] px-5 py-5 align-top">
                            <StatusBadge isActive={country.isActive} />
                          </td>

                          <td className="min-w-[190px] px-5 py-5 align-top">
                            <CountryActions
                              country={country}
                              updatingId={updatingId}
                              onEdit={startEditing}
                              onToggle={toggleCountry}
                              onDelete={setCountryToDelete}
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
          </div>
        </section>
      </section>

      <section className="mt-6 rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl shadow-slate-200">
        <div className="grid gap-6 md:grid-cols-[1fr_0.35fr] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-300">
              Países conectados
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Los países activos alimentan el catálogo y productos.
            </h2>

            <p className="mt-4 text-sm font-semibold leading-7 text-slate-300">
              Si desactivas un país, dejará de aparecer como opción activa al
              crear o editar productos.
            </p>
          </div>

          <Globe2 className="text-blue-300" size={52} />
        </div>
      </section>

      <ConfirmModal
        open={Boolean(countryToDelete)}
        title="Eliminar país"
        description={`¿Seguro que deseas eliminar "${
          countryToDelete?.name ?? ""
        }"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        loading={deletingCountry}
        danger
        onCancel={() => setCountryToDelete(null)}
        onConfirm={confirmDeleteCountry}
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
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
          className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function CountryInfo({ country }: { country: PublicCountry }) {
  return (
    <div>
      <p className="font-black text-slate-950">
        <span className="mr-2">{country.flag || "🌎"}</span>
        {country.name}
      </p>

      <p className="mt-1 text-sm font-semibold text-[#0057A8]">
        /pais/{country.slug}
      </p>

      <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
        {country.description || "Sin descripción"}
      </p>
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

function CountryActions({
  country,
  updatingId,
  onEdit,
  onToggle,
  onDelete,
}: {
  country: PublicCountry;
  updatingId: string;
  onEdit: (country: PublicCountry) => void;
  onToggle: (country: PublicCountry) => void;
  onDelete: (country: PublicCountry) => void;
}) {
  const isUpdating = updatingId === country.id;

  return (
    <div className="grid gap-2">
      <Link
        href={`/pais/${country.slug}`}
        target="_blank"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0057A8] px-4 py-3 text-xs font-black text-white transition hover:bg-blue-700"
      >
        <Eye size={16} />
        Ver
      </Link>

      <button
        type="button"
        onClick={() => onEdit(country)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:bg-slate-800"
      >
        <Pencil size={16} />
        Editar
      </button>

      <button
        type="button"
        disabled={isUpdating}
        onClick={() => onToggle(country)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {country.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
        {country.isActive ? "Desactivar" : "Activar"}
      </button>

      <button
        type="button"
        disabled={isUpdating}
        onClick={() => onDelete(country)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E31B23] px-4 py-3 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 size={16} />
        Eliminar
      </button>
    </div>
  );
}

function CountryMobileCard({
  country,
  updatingId,
  onEdit,
  onToggle,
  onDelete,
}: {
  country: PublicCountry;
  updatingId: string;
  onEdit: (country: PublicCountry) => void;
  onToggle: (country: PublicCountry) => void;
  onDelete: (country: PublicCountry) => void;
}) {
  return (
    <article className="rounded-[1.7rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <CountryInfo country={country} />

        <StatusBadge isActive={country.isActive} />
      </div>

      <div className="mt-5">
        <CountryActions
          country={country}
          updatingId={updatingId}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="p-10 text-center">
      <Globe2 className="mx-auto mb-4 text-slate-400" size={46} />

      <p className="text-2xl font-black">No hay países encontrados.</p>

      <p className="mt-2 text-sm font-semibold text-slate-500">
        Crea un nuevo país desde el formulario.
      </p>
    </div>
  );
}