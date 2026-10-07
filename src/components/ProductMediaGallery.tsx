"use client";

import ProductImage from "@/components/ProductImage";
import { getColorHex, type ColorOption } from "@/lib/product-options";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  PlayCircle,
  Smartphone,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ProductMediaGalleryProps = {
  product: {
    name: string;
    imageUrl?: string;
    gallery?: string[];
    videoUrl?: string;
    countryFlag: string;
    country: string;
  };
  /** Colores del producto, cada uno con sus fotos */
  colors: ColorOption[];
  selectedColor: number;
  onColorChange: (index: number) => void;
};

type Slide = {
  url: string;
  /** Índice del color al que pertenece la foto (null = foto general) */
  colorIndex: number | null;
};

const MAX_SLIDES = 12;

function isDirectVideo(url: string) {
  const cleanUrl = url.toLowerCase();

  return (
    cleanUrl.includes(".mp4") ||
    cleanUrl.includes(".webm") ||
    cleanUrl.includes(".mov") ||
    cleanUrl.includes("supabase")
  );
}

export default function ProductMediaGallery({
  product,
  colors,
  selectedColor,
  onColorChange,
}: ProductMediaGalleryProps) {
  // Todas las fotos: primero las generales y luego las de cada color
  const slides = useMemo<Slide[]>(() => {
    const colorSlides: Slide[] = colors.flatMap((color, colorIndex) =>
      color.images.map((url) => ({ url, colorIndex }))
    );

    const colorUrls = new Set(colorSlides.map((slide) => slide.url));

    const generalUrls = Array.from(
      new Set(
        [product.imageUrl, ...(product.gallery ?? [])].filter(
          (url): url is string => Boolean(url)
        )
      )
    ).filter((url) => !colorUrls.has(url));

    const generalSlides: Slide[] = generalUrls.map((url) => ({
      url,
      colorIndex: null,
    }));

    const unique: Slide[] = [];
    const seen = new Set<string>();

    [...generalSlides, ...colorSlides].forEach((slide) => {
      if (!seen.has(slide.url)) {
        seen.add(slide.url);
        unique.push(slide);
      }
    });

    return unique.slice(0, MAX_SLIDES);
  }, [colors, product.imageUrl, product.gallery]);

  const [selectedUrl, setSelectedUrl] = useState(slides[0]?.url ?? "");
  const mounted = useRef(false);

  // Al elegir un color desde los botones, se muestra la foto de ese color.
  // (No se ejecuta al cargar: al inicio se ve la foto principal del producto.)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const current = slides.find((slide) => slide.url === selectedUrl);

    if (current && current.colorIndex === selectedColor) {
      return;
    }

    const first = slides.find((slide) => slide.colorIndex === selectedColor);

    if (first) {
      setSelectedUrl(first.url);
    }
    // Solo reacciona al cambio de color, no a cada clic en una miniatura
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor]);

  const selectedIndex = Math.max(
    slides.findIndex((slide) => slide.url === selectedUrl),
    0
  );

  const hasSlides = slides.length > 0;
  const hasVideo = Boolean(product.videoUrl);

  function selectSlide(slide: Slide) {
    setSelectedUrl(slide.url);

    if (slide.colorIndex !== null && slide.colorIndex !== selectedColor) {
      onColorChange(slide.colorIndex);
    }
  }

  function goTo(offset: number) {
    if (!hasSlides) return;

    const nextIndex = (selectedIndex + offset + slides.length) % slides.length;

    selectSlide(slides[nextIndex]);
  }

  return (
    <div>
      {/* Imagen principal */}
      <div className="relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <span className="absolute left-4 top-4 z-20 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-line">
          {product.countryFlag} Importado de {product.country}
        </span>

        <div className="relative aspect-square">
          {hasSlides ? (
            <>
              {/* La key hace que la foto aparezca con un suave desvanecido */}
              <div key={selectedUrl} className="animate-fade-in absolute inset-0">
                <ProductImage
                  src={slides[selectedIndex]?.url}
                  alt={product.name}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="h-full w-full"
                />
              </div>

              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goTo(-1)}
                    aria-label="Imagen anterior"
                    className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-md ring-1 ring-line transition hover:bg-brand hover:text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <button
                    type="button"
                    onClick={() => goTo(1)}
                    aria-label="Imagen siguiente"
                    className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-md ring-1 ring-line transition hover:bg-brand hover:text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <a
                href={slides[selectedIndex]?.url}
                target="_blank"
                rel="noreferrer"
                aria-label="Ver imagen completa"
                className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md ring-1 ring-line transition hover:bg-brand hover:text-white"
              >
                <Maximize2 size={17} />
              </a>

              {slides.length > 1 && (
                <span className="absolute bottom-4 left-4 z-20 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white">
                  {selectedIndex + 1}/{slides.length}
                </span>
              )}
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-center">
              <div className="flex h-36 w-36 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-xl">
                <Smartphone size={80} />
              </div>

              <p className="mt-5 text-sm font-semibold text-slate-500">
                Imagen referencial
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Miniaturas (las de color llevan su bolita) */}
      {slides.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {slides.map((slide, index) => (
            <button
              key={slide.url}
              type="button"
              onClick={() => selectSlide(slide)}
              aria-label={
                slide.colorIndex !== null
                  ? `Ver ${colors[slide.colorIndex].name}`
                  : `Ver imagen ${index + 1}`
              }
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white transition ${
                selectedUrl === slide.url
                  ? "border-brand ring-2 ring-brand/25"
                  : "border-line hover:border-brand"
              }`}
            >
              <ProductImage
                src={slide.url}
                alt={`${product.name} imagen ${index + 1}`}
                sizes="64px"
                className="h-full w-full"
              />

              {slide.colorIndex !== null && (
                <span
                  className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-full border border-white shadow ring-1 ring-slate-300"
                  style={{ backgroundColor: getColorHex(colors[slide.colorIndex]) }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Video (solo si el producto tiene) */}
      {hasVideo && product.videoUrl && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <PlayCircle className="shrink-0 text-alert" size={28} />

              <div>
                <p className="text-sm font-semibold">Video del producto</p>
                <p className="text-xs text-slate-500">
                  Demostración y autenticidad del producto.
                </p>
              </div>
            </div>

            {!isDirectVideo(product.videoUrl) && (
              <a
                href={product.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
              >
                Ver video
                <ExternalLink size={15} />
              </a>
            )}
          </div>

          {isDirectVideo(product.videoUrl) && (
            <video
              src={product.videoUrl}
              controls
              className="mt-4 max-h-[420px] w-full rounded-xl bg-black object-contain"
            />
          )}
        </div>
      )}
    </div>
  );
}
