"use client";

import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Images,
  Maximize2,
  PlayCircle,
  Smartphone,
  Video,
} from "lucide-react";
import { useMemo, useState } from "react";

type ProductMediaGalleryProps = {
  product: {
    name: string;
    imageUrl?: string;
    gallery?: string[];
    videoUrl?: string;
    countryFlag: string;
    country: string;
    tag: string;
  };
};

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
}: ProductMediaGalleryProps) {
  const images = useMemo(() => {
    const allImages = [
      product.imageUrl,
      ...(product.gallery ?? []),
    ].filter(Boolean) as string[];

    return Array.from(new Set(allImages)).slice(0, 5);
  }, [product.imageUrl, product.gallery]);

  const [selectedImage, setSelectedImage] = useState(images[0] ?? "");

  const selectedIndex = Math.max(images.findIndex((image) => image === selectedImage), 0);
  const hasImages = images.length > 0;
  const hasVideo = Boolean(product.videoUrl);

  function goToPreviousImage() {
    if (!hasImages) return;

    const previousIndex =
      selectedIndex === 0 ? images.length - 1 : selectedIndex - 1;

    setSelectedImage(images[previousIndex]);
  }

  function goToNextImage() {
    if (!hasImages) return;

    const nextIndex =
      selectedIndex === images.length - 1 ? 0 : selectedIndex + 1;

    setSelectedImage(images[nextIndex]);
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_38%),radial-gradient(circle_at_bottom_right,#fee2e2,transparent_38%)]" />

        <div className="absolute left-6 top-6 z-20 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#0057A8] px-4 py-2 text-sm font-black text-white shadow-sm">
            {product.countryFlag} Importado de {product.country}
          </span>

          {hasImages && (
            <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
              {selectedIndex + 1}/{images.length}
            </span>
          )}
        </div>

        <span className="absolute right-6 top-6 z-20 rounded-full bg-[#E31B23] px-4 py-2 text-sm font-black text-white shadow-sm">
          {product.tag}
        </span>

        <div className="relative flex h-[520px] items-center justify-center p-8">
          {selectedImage ? (
            <>
              <Image
                src={selectedImage}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-10"
                priority
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousImage}
                    className="absolute left-5 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg transition hover:bg-[#0057A8] hover:text-white"
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <button
                    type="button"
                    onClick={goToNextImage}
                    className="absolute right-5 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-lg transition hover:bg-[#0057A8] hover:text-white"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              <a
                href={selectedImage}
                target="_blank"
                className="absolute bottom-6 right-6 z-20 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-xs font-black text-white shadow-lg transition hover:bg-[#0057A8]"
              >
                <Maximize2 size={16} />
                Ver imagen
              </a>
            </>
          ) : (
            <div className="relative z-10 text-center">
              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-[3rem] bg-slate-950 text-white shadow-2xl shadow-slate-200">
                <Smartphone size={110} />
              </div>

              <p className="mt-6 text-sm font-black uppercase tracking-[0.25em] text-[#0057A8]">
                Imagen referencial
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                {product.name}
              </h2>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Luego aquí se mostrarán fotos reales del producto.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-3">
        {hasImages ? (
          images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={`relative flex h-24 items-center justify-center overflow-hidden rounded-3xl border bg-white shadow-sm transition ${
                selectedImage === image
                  ? "border-[#0057A8] ring-2 ring-[#0057A8]/20"
                  : "border-slate-200 hover:border-[#0057A8]"
              }`}
            >
              <Image
                src={image}
                alt={`${product.name} imagen ${index + 1}`}
                fill
                sizes="120px"
                className="object-contain p-3"
              />

              <span className="absolute bottom-2 left-2 rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black text-white">
                {index + 1}
              </span>
            </button>
          ))
        ) : (
          [1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex h-24 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <Images className="text-slate-500" />
            </div>
          ))
        )}
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          {hasVideo ? (
            <PlayCircle className="mt-1 text-[#E31B23]" size={34} />
          ) : (
            <Video className="mt-1 text-slate-400" size={34} />
          )}

          <div className="w-full">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="font-black">Video de producto</p>

                <p className="text-sm font-semibold text-slate-500">
                  Video corto, demostración o autenticidad del producto.
                </p>
              </div>

              {hasVideo && product.videoUrl && !isDirectVideo(product.videoUrl) && (
                <a
                  href={product.videoUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0057A8] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  Ver video externo
                  <ExternalLink size={16} />
                </a>
              )}
            </div>

            {hasVideo && product.videoUrl ? (
              isDirectVideo(product.videoUrl) ? (
                <video
                  src={product.videoUrl}
                  controls
                  className="mt-4 max-h-[420px] w-full rounded-2xl bg-black object-contain"
                />
              ) : null
            ) : (
              <div className="mt-4 rounded-2xl bg-[#f6f8fc] p-5">
                <p className="text-sm font-semibold text-slate-500">
                  Aún no se agregó video para este producto.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}