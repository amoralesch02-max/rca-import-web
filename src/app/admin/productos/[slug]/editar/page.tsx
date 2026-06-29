"use client";

import AdminShell from "@/components/AdminShell";
import {
  getSupabaseAdminProductBySlug,
  updateSupabaseFullProductBySlug,
  type PublicProduct,
} from "@/lib/supabase-products";
import { supabase } from "@/lib/supabase";
import { uploadImageFile, uploadVideoFile } from "@/lib/supabase-storage";
import {
  AlertCircle,
  BadgeCheck,
  Boxes,
  ChevronLeft,
  DollarSign,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  ImageIcon,
  Layers,
  Package,
  RefreshCw,
  Save,
  Settings2,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Upload,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type TaxonomyOption = {
  name: string;
  flag?: string | null;
};

const MAX_GALLERY_IMAGES = 5;

const fallbackCategories: TaxonomyOption[] = [
  { name: "iPhones" },
  { name: "Accesorios" },
  { name: "Cables" },
  { name: "Cubos" },
  { name: "Cases" },
  { name: "Relojes" },
  { name: "Perfumes" },
  { name: "Zapatillas" },
  { name: "Mayorista" },
];

const fallbackBrands: TaxonomyOption[] = [
  { name: "Apple" },
  { name: "RCA Accessories" },
];

const fallbackCountries: TaxonomyOption[] = [
  { name: "USA", flag: "🇺🇸" },
  { name: "China", flag: "🇨🇳" },
  { name: "Perú", flag: "🇵🇪" },
];

const conditionOptions = ["Nuevo", "Open Box", "Seminuevo"];

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function parseLines(text: string) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(items: string[] | undefined) {
  return items && items.length > 0 ? items.join("\n") : "";
}

function isDirectVideo(url: string) {
  const cleanUrl = url.toLowerCase();

  return (
    cleanUrl.includes("supabase") ||
    cleanUrl.endsWith(".mp4") ||
    cleanUrl.endsWith(".webm") ||
    cleanUrl.endsWith(".mov")
  );
}

function ensureOption(options: TaxonomyOption[], option: TaxonomyOption) {
  const exists = options.some((item) => item.name === option.name);

  if (exists || !option.name) {
    return options;
  }

  return [option, ...options];
}

async function fetchTaxonomies() {
  const [categoriesResult, brandsResult, countriesResult] = await Promise.all([
    supabase
      .from("categories")
      .select("name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("brands")
      .select("name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("import_countries")
      .select("name, flag")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  const categories =
    categoriesResult.data && categoriesResult.data.length > 0
      ? (categoriesResult.data as TaxonomyOption[])
      : fallbackCategories;

  const brands =
    brandsResult.data && brandsResult.data.length > 0
      ? (brandsResult.data as TaxonomyOption[])
      : fallbackBrands;

  const countries =
    countriesResult.data && countriesResult.data.length > 0
      ? (countriesResult.data as TaxonomyOption[])
      : fallbackCountries;

  return {
    categories,
    brands,
    countries,
  };
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const currentSlug = String(params.slug);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taxonomyLoading, setTaxonomyLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [categoryOptions, setCategoryOptions] =
    useState<TaxonomyOption[]>(fallbackCategories);
  const [brandOptions, setBrandOptions] =
    useState<TaxonomyOption[]>(fallbackBrands);
  const [countryOptions, setCountryOptions] =
    useState<TaxonomyOption[]>(fallbackCountries);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: fallbackCategories[0].name,
    brand: fallbackBrands[0].name,
    price: "",
    salePrice: "",
    stock: "1",
    reservedStock: "0",
    country: fallbackCountries[0].name,
    countryFlag: fallbackCountries[0].flag ?? "🌎",
    condition: "Nuevo",
    tag: "Nuevo",
    description: "",
    featuresText: "",
    variantsText: "",
    imageUrl: "",
    galleryText: "",
    videoUrl: "",
    wholesale: false,
    allowsReservation: true,
    invoice: true,
    visible: true,
    available: true,
    featured: false,
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
      setLoading(true);
      setTaxonomyLoading(true);

      const [supabaseProduct, taxonomies] = await Promise.all([
        getSupabaseAdminProductBySlug(currentSlug),
        fetchTaxonomies(),
      ]);

      if (!supabaseProduct) {
        setProduct(null);
        setLoading(false);
        setTaxonomyLoading(false);
        return;
      }

      const nextCategories = ensureOption(taxonomies.categories, {
        name: supabaseProduct.category,
      });

      const nextBrands = ensureOption(taxonomies.brands, {
        name: supabaseProduct.brand,
      });

      const nextCountries = ensureOption(taxonomies.countries, {
        name: supabaseProduct.country,
        flag: supabaseProduct.countryFlag,
      });

      setCategoryOptions(nextCategories);
      setBrandOptions(nextBrands);
      setCountryOptions(nextCountries);
      setProduct(supabaseProduct);

      setForm({
        name: supabaseProduct.name,
        slug: supabaseProduct.slug,
        category: supabaseProduct.category,
        brand: supabaseProduct.brand,
        price: String(supabaseProduct.price),
        salePrice: supabaseProduct.salePrice
          ? String(supabaseProduct.salePrice)
          : "",
        stock: String(supabaseProduct.stock),
        reservedStock: String(supabaseProduct.reservedStock),
        country: supabaseProduct.country,
        countryFlag: supabaseProduct.countryFlag || "🌎",
        condition: supabaseProduct.condition || "Nuevo",
        tag: supabaseProduct.tag || "Nuevo",
        description: supabaseProduct.description || "",
        featuresText: joinLines(supabaseProduct.features),
        variantsText: joinLines(supabaseProduct.variants),
        imageUrl: supabaseProduct.imageUrl ?? "",
        galleryText: joinLines(supabaseProduct.gallery),
        videoUrl: supabaseProduct.videoUrl ?? "",
        wholesale: supabaseProduct.wholesale,
        allowsReservation: supabaseProduct.allowsReservation,
        invoice: supabaseProduct.invoice,
        visible: supabaseProduct.visible !== false,
        available: supabaseProduct.available !== false,
        featured: Boolean(supabaseProduct.featured),
      });

      setLoading(false);
      setTaxonomyLoading(false);
    }

    if (currentSlug) {
      checkSessionAndLoad();
    }
  }, [currentSlug, router]);

  async function reloadTaxonomies() {
    setTaxonomyLoading(true);

    const taxonomies = await fetchTaxonomies();

    setCategoryOptions(
      product
        ? ensureOption(taxonomies.categories, { name: product.category })
        : taxonomies.categories
    );

    setBrandOptions(
      product
        ? ensureOption(taxonomies.brands, { name: product.brand })
        : taxonomies.brands
    );

    setCountryOptions(
      product
        ? ensureOption(taxonomies.countries, {
            name: product.country,
            flag: product.countryFlag,
          })
        : taxonomies.countries
    );

    setTaxonomyLoading(false);
  }

  const finalSlug = useMemo(() => {
    return form.slug.trim() ? generateSlug(form.slug) : generateSlug(form.name);
  }, [form.slug, form.name]);

  const previewPrice = Number(form.salePrice || form.price || 0);

  const galleryImages = useMemo(() => {
    return parseLines(form.galleryText).slice(0, MAX_GALLERY_IMAGES);
  }, [form.galleryText]);

  const features = useMemo(() => {
    return parseLines(form.featuresText);
  }, [form.featuresText]);

  const variants = useMemo(() => {
    return parseLines(form.variantsText);
  }, [form.variantsText]);

  function updateCountry(countryName: string) {
    const selectedCountry = countryOptions.find(
      (country) => country.name === countryName
    );

    setForm({
      ...form,
      country: countryName,
      countryFlag: selectedCountry?.flag || "🌎",
    });
  }

  async function handleMainImageUpload(file: File | null) {
    if (!file) return;

    setUploadingImage(true);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await uploadImageFile(file, "productos/principal");

    setUploadingImage(false);

    if (!result.success) {
      setErrorMessage(result.error || "No se pudo subir la imagen.");
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      imageUrl: result.url,
    }));

    setSuccessMessage("Imagen principal subida correctamente.");
  }

  async function handleGalleryUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const currentGallery = parseLines(form.galleryText);
    const availableSlots = MAX_GALLERY_IMAGES - currentGallery.length;

    if (availableSlots <= 0) {
      setErrorMessage(`La galería solo permite ${MAX_GALLERY_IMAGES} imágenes.`);
      return;
    }

    setUploadingGallery(true);
    setErrorMessage("");
    setSuccessMessage("");

    const files = Array.from(fileList).slice(0, availableSlots);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const result = await uploadImageFile(file, "productos/galeria");

      if (result.success && result.url) {
        uploadedUrls.push(result.url);
      }
    }

    setUploadingGallery(false);

    if (uploadedUrls.length === 0) {
      setErrorMessage("No se pudo subir ninguna imagen de galería.");
      return;
    }

    setForm((currentForm) => {
      const nextGallery = [
        ...parseLines(currentForm.galleryText),
        ...uploadedUrls,
      ].slice(0, MAX_GALLERY_IMAGES);

      return {
        ...currentForm,
        galleryText: nextGallery.join("\n"),
      };
    });

    setSuccessMessage(
      `${uploadedUrls.length} imagen(es) agregada(s) a la galería.`
    );
  }

  async function handleVideoUpload(file: File | null) {
    if (!file) return;

    setUploadingVideo(true);
    setErrorMessage("");
    setSuccessMessage("");

    const result = await uploadVideoFile(file, "productos/videos");

    setUploadingVideo(false);

    if (!result.success) {
      setErrorMessage(result.error || "No se pudo subir el video.");
      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      videoUrl: result.url,
    }));

    setSuccessMessage("Video corto subido correctamente.");
  }

  function removeGalleryImage(imageUrl: string) {
    const nextGallery = parseLines(form.galleryText).filter(
      (image) => image !== imageUrl
    );

    setForm({
      ...form,
      galleryText: nextGallery.join("\n"),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!product) {
      setErrorMessage("No se encontró el producto para editar.");
      return;
    }

    if (!form.name.trim()) {
      setErrorMessage("Ingresa el nombre del producto.");
      return;
    }

    if (!finalSlug.trim()) {
      setErrorMessage("El producto necesita un slug válido.");
      return;
    }

    if (!form.category.trim()) {
      setErrorMessage("Selecciona una categoría.");
      return;
    }

    if (!form.brand.trim()) {
      setErrorMessage("Selecciona una marca.");
      return;
    }

    if (!form.country.trim()) {
      setErrorMessage("Selecciona un país de importación.");
      return;
    }

    const priceNumber = Number(form.price);
    const salePriceNumber = form.salePrice ? Number(form.salePrice) : null;
    const stockNumber = Number(form.stock);
    const reservedStockNumber = Number(form.reservedStock);

    if (Number.isNaN(priceNumber) || priceNumber <= 0) {
      setErrorMessage("Ingresa un precio válido.");
      return;
    }

    if (
      form.salePrice &&
      (Number.isNaN(salePriceNumber) || Number(salePriceNumber) <= 0)
    ) {
      setErrorMessage("Ingresa un precio de oferta válido o déjalo vacío.");
      return;
    }

    if (salePriceNumber && salePriceNumber >= priceNumber) {
      setErrorMessage("El precio de oferta debe ser menor al precio normal.");
      return;
    }

    if (Number.isNaN(stockNumber) || stockNumber < 0) {
      setErrorMessage("Ingresa un stock válido.");
      return;
    }

    if (Number.isNaN(reservedStockNumber) || reservedStockNumber < 0) {
      setErrorMessage("Ingresa un stock reservado válido.");
      return;
    }

    if (reservedStockNumber > stockNumber) {
      setErrorMessage("El stock reservado no puede ser mayor al stock total.");
      return;
    }

    setSaving(true);

    const result = await updateSupabaseFullProductBySlug(currentSlug, {
      name: form.name.trim(),
      slug: finalSlug,
      category: form.category,
      brand: form.brand,
      price: priceNumber,
      salePrice: salePriceNumber,
      stock: stockNumber,
      reservedStock: reservedStockNumber,
      country: form.country,
      countryFlag: form.countryFlag,
      condition: form.condition,
      tag: form.tag.trim() || "Nuevo",
      description: form.description.trim(),
      features,
      variants,
      imageUrl: form.imageUrl.trim(),
      gallery: galleryImages,
      videoUrl: form.videoUrl.trim(),
      wholesale: form.wholesale,
      allowsReservation: form.allowsReservation,
      invoice: form.invoice,
      visible: form.visible,
      available: form.available,
      featured: form.featured,
    });

    setSaving(false);

    if (!result.success) {
      setErrorMessage(
        result.error?.includes("duplicate key")
          ? "Ya existe un producto con ese slug. Cambia el slug antes de guardar."
          : "No se pudo editar el producto. Revisa los permisos de Supabase."
      );
      return;
    }

    router.push("/admin/productos");
  }

  if (!ready) {
    return null;
  }

  if (loading) {
    return (
      <AdminShell
        title="Editar producto"
        description="Cargando datos del producto desde Supabase."
      >
        <section className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <RefreshCw
            className="mx-auto mb-4 animate-spin text-[#0057A8]"
            size={42}
          />

          <p className="font-black">Cargando producto...</p>
        </section>
      </AdminShell>
    );
  }

  if (!product) {
    return (
      <AdminShell
        title="Producto no encontrado"
        description="No se encontró el producto solicitado en Supabase."
      >
        <section className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Package className="mx-auto mb-4 text-slate-400" size={46} />

          <p className="text-2xl font-black">Producto no encontrado.</p>

          <Link
            href="/admin/productos"
            className="mt-6 inline-flex rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white"
          >
            Volver a productos
          </Link>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Editar producto"
      description="Actualiza datos, imágenes, galería, video corto, stock y estado del producto."
    >
      <Link
        href="/admin/productos"
        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#0057A8] shadow-sm transition hover:bg-blue-50"
      >
        <ChevronLeft size={18} />
        Volver a productos
      </Link>

      {taxonomyLoading && (
        <div className="mt-5 flex gap-3 rounded-[1.5rem] border border-blue-100 bg-blue-50 p-5 text-sm font-bold text-[#0057A8]">
          <RefreshCw className="shrink-0 animate-spin" />
          <p>Cargando categorías, marcas y países desde Supabase...</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.42fr]"
      >
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Información principal
            </p>

            <h2 className="mt-3 text-3xl font-black">Datos del producto</h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Ahora las categorías, marcas y países se cargan desde Supabase.
            </p>

            {errorMessage && (
              <div className="mt-6 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-[#E31B23]">
                <AlertCircle className="shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="mt-6 flex gap-3 rounded-2xl bg-green-50 p-4 text-sm font-bold text-green-700">
                <BadgeCheck className="shrink-0" />
                <p>{successMessage}</p>
              </div>
            )}
          </div>

          <div className="grid gap-5 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Nombre del producto *"
                value={form.name}
                onChange={(value) => setForm({ ...form, name: value })}
                placeholder="Ejemplo: iPhone 15 Pro 128GB"
                icon={Package}
              />

              <InputField
                label="Slug"
                value={form.slug}
                onChange={(value) => setForm({ ...form, slug: value })}
                placeholder="Slug del producto"
                icon={Tag}
              />

              <SelectField
                label="Categoría *"
                value={form.category}
                onChange={(value) => setForm({ ...form, category: value })}
                options={categoryOptions.map((item) => item.name)}
                icon={Layers}
              />

              <SelectField
                label="Marca *"
                value={form.brand}
                onChange={(value) => setForm({ ...form, brand: value })}
                options={brandOptions.map((item) => item.name)}
                icon={BadgeCheck}
              />

              <InputField
                label="Precio normal *"
                value={form.price}
                onChange={(value) => setForm({ ...form, price: value })}
                placeholder="Ejemplo: 3899"
                type="number"
                icon={DollarSign}
              />

              <InputField
                label="Precio oferta"
                value={form.salePrice}
                onChange={(value) => setForm({ ...form, salePrice: value })}
                placeholder="Opcional"
                type="number"
                icon={DollarSign}
              />

              <InputField
                label="Stock *"
                value={form.stock}
                onChange={(value) => setForm({ ...form, stock: value })}
                placeholder="Ejemplo: 5"
                type="number"
                icon={Boxes}
              />

              <InputField
                label="Stock reservado"
                value={form.reservedStock}
                onChange={(value) =>
                  setForm({ ...form, reservedStock: value })
                }
                placeholder="Ejemplo: 0"
                type="number"
                icon={Boxes}
              />

              <div>
                <label className="text-sm font-black text-slate-700">
                  País de importación *
                </label>

                <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
                  <Globe2 className="shrink-0 text-slate-400" size={20} />

                  <select
                    value={form.country}
                    onChange={(event) => updateCountry(event.target.value)}
                    className="h-full w-full bg-transparent text-sm font-black outline-none"
                  >
                    {countryOptions.map((country) => (
                      <option key={country.name} value={country.name}>
                        {country.flag || "🌎"} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <SelectField
                label="Condición"
                value={form.condition}
                onChange={(value) => setForm({ ...form, condition: value })}
                options={conditionOptions}
                icon={Settings2}
              />

              <InputField
                label="Etiqueta"
                value={form.tag}
                onChange={(value) => setForm({ ...form, tag: value })}
                placeholder="Ejemplo: Destacado, Oferta, Nuevo"
                icon={Star}
              />

              <InputField
                label="Video URL"
                value={form.videoUrl}
                onChange={(value) => setForm({ ...form, videoUrl: value })}
                placeholder="URL externa o video subido"
                icon={Video}
              />
            </div>

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
                placeholder="Describe el producto, condición, garantía o detalles importantes..."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
              />
            </div>
          </div>
        </section>

        <aside className="grid h-fit gap-6">
          <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
                Vista rápida
              </p>

              <h2 className="mt-3 text-2xl font-black">Preview</h2>
            </div>

            <div className="p-6">
              <div className="rounded-[1.7rem] bg-[#f6f8fc] p-5">
                <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-white">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt={form.name || "Producto"}
                      className="h-full w-full object-contain p-3"
                    />
                  ) : (
                    <Package className="text-[#0057A8]" size={58} />
                  )}
                </div>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  {form.category} · {form.brand || "Marca"}
                </p>

                <h3 className="mt-2 line-clamp-2 text-2xl font-black">
                  {form.name || "Nombre del producto"}
                </h3>

                <p className="mt-2 truncate text-sm font-semibold text-slate-500">
                  Slug: {finalSlug || "producto-slug"}
                </p>

                <p className="mt-4 text-3xl font-black text-[#E31B23]">
                  S/ {previewPrice || 0}
                </p>

                {form.salePrice && (
                  <p className="mt-1 text-sm font-black text-slate-400 line-through">
                    S/ {form.price || 0}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill
                    active={form.visible}
                    activeText="Visible"
                    inactiveText="Oculto"
                  />

                  <StatusPill
                    active={form.available}
                    activeText="Disponible"
                    inactiveText="No disponible"
                  />

                  {form.featured && (
                    <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700">
                      Destacado
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Estado
            </p>

            <div className="mt-5 grid gap-3">
              <ToggleRow
                title="Visible en catálogo"
                icon={form.visible ? Eye : EyeOff}
                checked={form.visible}
                onChange={(checked) => setForm({ ...form, visible: checked })}
              />

              <ToggleRow
                title="Disponible"
                icon={BadgeCheck}
                checked={form.available}
                onChange={(checked) =>
                  setForm({ ...form, available: checked })
                }
              />

              <ToggleRow
                title="Destacado"
                icon={Star}
                checked={form.featured}
                onChange={(checked) =>
                  setForm({ ...form, featured: checked })
                }
              />

              <ToggleRow
                title="Mayorista"
                icon={Tag}
                checked={form.wholesale}
                onChange={(checked) =>
                  setForm({ ...form, wholesale: checked })
                }
              />

              <ToggleRow
                title="Permite separación"
                icon={Package}
                checked={form.allowsReservation}
                onChange={(checked) =>
                  setForm({ ...form, allowsReservation: checked })
                }
              />

              <ToggleRow
                title="Con comprobante"
                icon={FileText}
                checked={form.invoice}
                onChange={(checked) => setForm({ ...form, invoice: checked })}
              />
            </div>

            <button
              type="button"
              onClick={reloadTaxonomies}
              disabled={taxonomyLoading}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
            >
              <RefreshCw
                className={taxonomyLoading ? "animate-spin" : ""}
                size={17}
              />
              Recargar opciones
            </button>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-200 p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Multimedia
            </p>

            <h2 className="mt-3 text-3xl font-black">Imágenes y video</h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Cambia imagen principal, galería y video corto del producto.
            </p>
          </div>

          <div className="grid gap-5 p-6 lg:grid-cols-3">
            <section className="rounded-[1.7rem] border border-slate-200 bg-[#f6f8fc] p-5">
              <p className="font-black">Imagen principal</p>

              <div className="mt-4 flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-white">
                {form.imageUrl ? (
                  <img
                    src={form.imageUrl}
                    alt={form.name || "Imagen principal"}
                    className="h-full w-full object-contain p-4"
                  />
                ) : (
                  <ImageIcon className="text-slate-400" size={46} />
                )}
              </div>

              <div className="mt-4 grid gap-3">
                <InputSimple
                  value={form.imageUrl}
                  onChange={(value) => setForm({ ...form, imageUrl: value })}
                  placeholder="URL de imagen principal"
                  icon={ImageIcon}
                />

                <label className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800">
                  <Upload size={18} />
                  {uploadingImage ? "Subiendo..." : "Cambiar imagen"}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(event) => {
                      handleMainImageUpload(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                </label>

                {form.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, imageUrl: "" })}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 text-sm font-black text-[#E31B23] transition hover:bg-red-100"
                  >
                    <Trash2 size={17} />
                    Quitar imagen
                  </button>
                )}
              </div>
            </section>

            <section className="rounded-[1.7rem] border border-slate-200 bg-[#f6f8fc] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black">Galería</p>

                <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-500">
                  {galleryImages.length}/{MAX_GALLERY_IMAGES}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {galleryImages.length > 0 ? (
                  galleryImages.map((image) => (
                    <div
                      key={image}
                      className="group relative flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-white"
                    >
                      <img
                        src={image}
                        alt="Imagen de galería"
                        className="h-full w-full object-contain p-3"
                      />

                      <button
                        type="button"
                        onClick={() => removeGalleryImage(image)}
                        className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-full bg-[#E31B23] text-white shadow-lg group-hover:flex"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 flex h-56 items-center justify-center rounded-2xl bg-white">
                    <ImageIcon className="text-slate-400" size={46} />
                  </div>
                )}
              </div>

              <textarea
                value={form.galleryText}
                onChange={(event) =>
                  setForm({ ...form, galleryText: event.target.value })
                }
                rows={5}
                placeholder="Una URL por línea o sube varias imágenes"
                className="mt-4 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8]"
              />

              <label className="mt-3 inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800">
                <Upload size={18} />
                {uploadingGallery ? "Subiendo..." : "Agregar imágenes"}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  multiple
                  className="hidden"
                  disabled={uploadingGallery}
                  onChange={(event) => {
                    handleGalleryUpload(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
            </section>

            <section className="rounded-[1.7rem] border border-slate-200 bg-[#f6f8fc] p-5">
              <p className="font-black">Video corto</p>

              <div className="mt-4 flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-white">
                {form.videoUrl ? (
                  isDirectVideo(form.videoUrl) ? (
                    <video
                      src={form.videoUrl}
                      controls
                      className="h-full w-full bg-black object-contain"
                    />
                  ) : (
                    <div className="p-5 text-center">
                      <Video className="mx-auto text-[#0057A8]" size={44} />

                      <p className="mt-3 text-sm font-bold text-slate-500">
                        URL externa registrada.
                      </p>
                    </div>
                  )
                ) : (
                  <Video className="text-slate-400" size={46} />
                )}
              </div>

              <div className="mt-4 grid gap-3">
                <InputSimple
                  value={form.videoUrl}
                  onChange={(value) => setForm({ ...form, videoUrl: value })}
                  placeholder="URL externa o video subido"
                  icon={Video}
                />

                <label className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#0057A8] px-5 text-sm font-black text-white transition hover:bg-blue-700">
                  <Upload size={18} />
                  {uploadingVideo ? "Subiendo..." : "Cambiar video"}

                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    disabled={uploadingVideo}
                    onChange={(event) => {
                      handleVideoUpload(event.target.files?.[0] ?? null);
                      event.target.value = "";
                    }}
                  />
                </label>

                {form.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, videoUrl: "" })}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 text-sm font-black text-[#E31B23] transition hover:bg-red-100"
                  >
                    <Trash2 size={17} />
                    Quitar video
                  </button>
                )}
              </div>
            </section>
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-200 p-6">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Detalles comerciales
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Características y variantes
            </h2>
          </div>

          <div className="grid gap-5 p-6 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-black text-slate-700">
                  Características
                </label>

                <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#0057A8]">
                  {features.length} item(s)
                </span>
              </div>

              <textarea
                value={form.featuresText}
                onChange={(event) =>
                  setForm({ ...form, featuresText: event.target.value })
                }
                rows={7}
                placeholder="Una característica por línea"
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-black text-slate-700">
                  Variantes
                </label>

                <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#0057A8]">
                  {variants.length} item(s)
                </span>
              </div>

              <textarea
                value={form.variantsText}
                onChange={(event) =>
                  setForm({ ...form, variantsText: event.target.value })
                }
                rows={7}
                placeholder={"Una por línea\nNatural Titanium\nBlack Titanium"}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#0057A8] focus:bg-white"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-200 xl:col-span-2">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                <Sparkles size={16} />
                Editando producto
              </div>

              <h2 className="mt-4 text-3xl font-black">
                Guarda los cambios para actualizar Supabase.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                Se actualizarán los datos comerciales, multimedia, estado y
                stock del producto.
              </p>
            </div>

            <button
              type="submit"
              disabled={
                saving ||
                uploadingImage ||
                uploadingGallery ||
                uploadingVideo ||
                taxonomyLoading
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0057A8] px-7 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </section>
      </form>
    </AdminShell>
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
          className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function InputSimple({
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 transition focus-within:border-[#0057A8]">
      <Icon className="shrink-0 text-slate-400" size={20} />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  icon: LucideIcon;
}) {
  return (
    <div>
      <label className="text-sm font-black text-slate-700">{label}</label>

      <div className="mt-2 flex h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-4 transition focus-within:border-[#0057A8] focus-within:bg-white">
        <Icon className="shrink-0 text-slate-400" size={20} />

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full w-full bg-transparent text-sm font-black outline-none"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  icon: Icon,
  checked,
  onChange,
}: {
  title: string;
  icon: LucideIcon;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-[#f6f8fc] p-4 transition hover:bg-slate-100">
      <div className="flex items-center gap-3">
        <Icon
          className={checked ? "text-[#0057A8]" : "text-slate-300"}
          size={20}
        />

        <p className="text-sm font-black text-slate-700">{title}</p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#0057A8]"
      />
    </label>
  );
}

function StatusPill({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return (
    <span
      className={`rounded-full px-3 py-2 text-xs font-black ${
        active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? activeText : inactiveText}
    </span>
  );
}