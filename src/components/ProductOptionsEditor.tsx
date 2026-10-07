"use client";

import {
  getColorHex,
  guessColorHex,
  type ColorOption,
  type StorageOption,
} from "@/lib/product-options";
import { uploadImageFile } from "@/lib/supabase-storage";
import {
  AlertCircle,
  HardDrive,
  Palette,
  Plus,
  RefreshCw,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";

/**
 * Editor de colores (con sus imágenes) y capacidades (con su precio)
 * para el formulario de producto del panel administrador.
 *
 * Se usa igual en "Nuevo producto" y en "Editar producto".
 */

const MAX_IMAGES_PER_COLOR = 4;

const COLOR_SUGGESTIONS = [
  "Negro",
  "Blanco",
  "Azul",
  "Naranja cósmico",
  "Natural",
  "Plata",
  "Rosa",
  "Verde",
  "Morado",
  "Dorado",
];

const STORAGE_SUGGESTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB", "2TB"];

type ProductOptionsEditorProps = {
  colors: ColorOption[];
  onColorsChange: (colors: ColorOption[]) => void;
  storages: StorageOption[];
  onStoragesChange: (storages: StorageOption[]) => void;
  /** Precio general del producto (solo para mostrar un aviso útil) */
  basePrice?: number;
};

export default function ProductOptionsEditor({
  colors,
  onColorsChange,
  storages,
  onStoragesChange,
  basePrice,
}: ProductOptionsEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  /* ---------------- Colores ---------------- */

  function addColor(name = "") {
    if (
      name &&
      colors.some((color) => color.name.toLowerCase() === name.toLowerCase())
    ) {
      return;
    }

    onColorsChange([...colors, { name, hex: "", images: [] }]);
  }

  function updateColor(index: number, changes: Partial<ColorOption>) {
    onColorsChange(
      colors.map((color, i) => (i === index ? { ...color, ...changes } : color))
    );
  }

  function removeColor(index: number) {
    onColorsChange(colors.filter((_, i) => i !== index));
  }

  async function handleColorImages(index: number, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const color = colors[index];
    const slots = MAX_IMAGES_PER_COLOR - color.images.length;

    if (slots <= 0) {
      setMessage(
        `Cada color permite hasta ${MAX_IMAGES_PER_COLOR} imágenes. Elimina una para subir otra.`
      );
      return;
    }

    setMessage("");
    setUploadingIndex(index);

    const uploaded: string[] = [];
    let lastError = "";

    for (const file of Array.from(fileList).slice(0, slots)) {
      const result = await uploadImageFile(file, "productos/colores");

      if (result.success && result.url) {
        uploaded.push(result.url);
      } else {
        lastError = result.error || "No se pudo subir una imagen.";
      }
    }

    setUploadingIndex(null);

    if (uploaded.length === 0) {
      setMessage(lastError || "No se pudo subir ninguna imagen.");
      return;
    }

    // Se vuelve a leer el estado actual del color antes de agregar
    onColorsChange(
      colors.map((item, i) =>
        i === index
          ? {
              ...item,
              images: [...item.images, ...uploaded].slice(
                0,
                MAX_IMAGES_PER_COLOR
              ),
            }
          : item
      )
    );

    if (lastError) {
      setMessage(lastError);
    }
  }

  function removeColorImage(colorIndex: number, imageUrl: string) {
    updateColor(colorIndex, {
      images: colors[colorIndex].images.filter((image) => image !== imageUrl),
    });
  }

  function makePrimaryImage(colorIndex: number, imageUrl: string) {
    updateColor(colorIndex, {
      images: [
        imageUrl,
        ...colors[colorIndex].images.filter((image) => image !== imageUrl),
      ],
    });
  }

  /* ---------------- Capacidades ---------------- */

  function addStorage(label = "") {
    if (
      label &&
      storages.some(
        (storage) => storage.label.toLowerCase() === label.toLowerCase()
      )
    ) {
      return;
    }

    onStoragesChange([...storages, { label, price: 0, salePrice: null }]);
  }

  function updateStorage(index: number, changes: Partial<StorageOption>) {
    onStoragesChange(
      storages.map((storage, i) =>
        i === index ? { ...storage, ...changes } : storage
      )
    );
  }

  function removeStorage(index: number) {
    onStoragesChange(storages.filter((_, i) => i !== index));
  }

  const cheapest =
    storages.filter((storage) => storage.price > 0).length > 0
      ? Math.min(
          ...storages
            .filter((storage) => storage.price > 0)
            .map((storage) => storage.price)
        )
      : null;

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm xl:col-span-2">
      <div className="border-b border-slate-200 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0057A8]">
            <Palette size={28} />
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
              Opciones del producto
            </p>

            <h2 className="mt-1 text-2xl font-black">
              Colores y capacidades
            </h2>
          </div>
        </div>

        <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-500">
          Cada color puede tener sus propias fotos: al elegir un color en la
          tienda, el cliente verá la imagen de ese color. Las capacidades
          (256GB, 512GB…) tienen su propio precio. Ambas son opcionales.
        </p>

        {message && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-[#E31B23]">
            <AlertCircle className="shrink-0" />
            <p>{message}</p>
          </div>
        )}
      </div>

      <div className="grid gap-10 p-6 md:p-8">
        {/* ================= COLORES ================= */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-black">Colores e imágenes</h3>

            <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#0057A8]">
              {colors.length} color(es)
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Recomendado: fotos cuadradas de 1254 × 1254 px, con el producto
            centrado. La primera foto de cada color es la que se muestra al
            elegirlo.
          </p>

          {colors.length > 0 && (
            <div className="mt-5 grid gap-4">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className="rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-5"
                >
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[200px] flex-1">
                      <label className="text-xs font-black text-slate-600">
                        Nombre del color
                      </label>

                      <input
                        value={color.name}
                        onChange={(event) =>
                          updateColor(index, { name: event.target.value })
                        }
                        list="rca-color-suggestions"
                        placeholder="Ej: Naranja cósmico"
                        className="mt-1.5 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#0057A8]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-black text-slate-600">
                        Bolita
                      </label>

                      <div className="mt-1.5 flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3">
                        <input
                          type="color"
                          value={getColorHex(color)}
                          onChange={(event) =>
                            updateColor(index, { hex: event.target.value })
                          }
                          aria-label="Elegir color de la bolita"
                          className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
                        />

                        <span className="text-xs font-bold uppercase text-slate-500">
                          {getColorHex(color)}
                        </span>

                        {color.hex && color.hex !== guessColorHex(color.name) && (
                          <button
                            type="button"
                            onClick={() => updateColor(index, { hex: "" })}
                            className="text-[11px] font-black text-[#0057A8] underline"
                          >
                            Auto
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      aria-label={`Eliminar color ${color.name || index + 1}`}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#E31B23] transition hover:bg-[#E31B23] hover:text-white"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Imágenes del color */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    {color.images.map((image, imageIndex) => (
                      <div
                        key={image}
                        className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-white"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={`${color.name} ${imageIndex + 1}`}
                          className="h-full w-full object-contain"
                        />

                        {imageIndex === 0 && (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-[#0057A8] px-2 py-0.5 text-[10px] font-black text-white">
                            Principal
                          </span>
                        )}

                        <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-slate-950/70 p-1 opacity-0 transition group-hover:opacity-100">
                          {imageIndex !== 0 ? (
                            <button
                              type="button"
                              onClick={() => makePrimaryImage(index, image)}
                              aria-label="Hacer principal"
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-950"
                            >
                              <Star size={12} />
                            </button>
                          ) : (
                            <span />
                          )}

                          <button
                            type="button"
                            onClick={() => removeColorImage(index, image)}
                            aria-label="Quitar imagen"
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E31B23] text-white"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {color.images.length < MAX_IMAGES_PER_COLOR && (
                      <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[#0057A8] bg-white text-center text-[11px] font-black text-[#0057A8] transition hover:bg-blue-50">
                        {uploadingIndex === index ? (
                          <RefreshCw className="animate-spin" size={20} />
                        ) : (
                          <Upload size={20} />
                        )}

                        {uploadingIndex === index ? "Subiendo..." : "Subir fotos"}

                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          disabled={uploadingIndex !== null}
                          onChange={(event) => {
                            handleColorImages(index, event.target.files);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <datalist id="rca-color-suggestions">
            {COLOR_SUGGESTIONS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addColor()}
              className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Agregar color
            </button>

            <span className="text-xs font-bold text-slate-400">
              o agrega rápido:
            </span>

            {COLOR_SUGGESTIONS.slice(0, 6).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => addColor(name)}
                disabled={colors.some(
                  (color) => color.name.toLowerCase() === name.toLowerCase()
                )}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-[#0057A8] hover:text-[#0057A8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full border border-slate-200"
                  style={{ backgroundColor: guessColorHex(name) }}
                />
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* ================= CAPACIDADES ================= */}
        <div className="border-t border-slate-200 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-black">
              <HardDrive size={20} className="text-[#0057A8]" />
              Capacidades y precios
            </h3>

            <span className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-[#0057A8]">
              {storages.length} capacidad(es)
            </span>
          </div>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            Si agregas capacidades, el precio de la tienda cambia según la que
            elija el cliente. Si no agregas ninguna, se usa el precio general
            del producto.
          </p>

          {storages.length > 0 && (
            <div className="mt-5 grid gap-3">
              <div className="hidden grid-cols-[1fr_1fr_1fr_48px] gap-3 px-1 text-xs font-black text-slate-500 md:grid">
                <span>Capacidad</span>
                <span>Precio (S/)</span>
                <span>Oferta (S/) · opcional</span>
                <span />
              </div>

              {storages.map((storage, index) => (
                <div
                  key={index}
                  className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-[#f6f8fc] p-4 md:grid-cols-[1fr_1fr_1fr_48px] md:items-center md:border-0 md:bg-transparent md:p-0"
                >
                  <input
                    value={storage.label}
                    onChange={(event) =>
                      updateStorage(index, { label: event.target.value })
                    }
                    list="rca-storage-suggestions"
                    placeholder="Ej: 256GB"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#0057A8]"
                  />

                  <input
                    type="number"
                    min={0}
                    value={storage.price || ""}
                    onChange={(event) =>
                      updateStorage(index, {
                        price: Number(event.target.value) || 0,
                      })
                    }
                    placeholder="Precio"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#0057A8]"
                  />

                  <input
                    type="number"
                    min={0}
                    value={storage.salePrice ?? ""}
                    onChange={(event) =>
                      updateStorage(index, {
                        salePrice: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                    placeholder="Precio de oferta"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none transition focus:border-[#0057A8]"
                  />

                  <button
                    type="button"
                    onClick={() => removeStorage(index)}
                    aria-label={`Eliminar capacidad ${storage.label || index + 1}`}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#E31B23] transition hover:bg-[#E31B23] hover:text-white"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <datalist id="rca-storage-suggestions">
            {STORAGE_SUGGESTIONS.map((label) => (
              <option key={label} value={label} />
            ))}
          </datalist>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addStorage()}
              className="inline-flex items-center gap-2 rounded-full bg-[#0057A8] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Agregar capacidad
            </button>

            <span className="text-xs font-bold text-slate-400">
              o agrega rápido:
            </span>

            {STORAGE_SUGGESTIONS.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => addStorage(label)}
                disabled={storages.some(
                  (storage) => storage.label.toLowerCase() === label.toLowerCase()
                )}
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 transition hover:border-[#0057A8] hover:text-[#0057A8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {label}
              </button>
            ))}
          </div>

          {cheapest !== null && basePrice !== undefined && basePrice !== cheapest && (
            <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-700">
              Consejo: el precio general del producto (S/ {basePrice || 0}) se
              usa como referencia en el panel. Para que coincida con la tienda,
              ponlo igual a la capacidad más barata (S/ {cheapest}).
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
