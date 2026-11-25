/**
 * Comprime una foto en el navegador antes de subirla a Supabase.
 *
 * - La achica para que su lado más largo no pase de `maxSide` px.
 * - La convierte a WebP (mantiene la transparencia de los PNG).
 * - Respeta la orientación de las fotos tomadas con el celular.
 * - Si algo falla, o la versión comprimida no es más liviana, se sube la
 *   original: nunca impide subir una imagen.
 *
 * Una foto de celular de 4 MB suele quedar en unos 150-300 KB.
 */

const QUALITY = 0.85;

/** Tipos que no se tocan: GIF (puede ser animado) y SVG (es vectorial) */
const SKIP_TYPES = ["image/gif", "image/svg+xml"];

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Algunos navegadores no aceptan la opción: se intenta de la otra forma
    }
  }

  const url = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function renameFile(name: string, extension: string) {
  const base = name.replace(/\.[^./\\]+$/, "") || "imagen";
  return `${base}.${extension}`;
}

export async function compressImage(file: File, maxSide = 1600): Promise<File> {
  if (typeof window === "undefined" || SKIP_TYPES.includes(file.type)) {
    return file;
  }

  try {
    const source = await decode(file);
    const width = "naturalWidth" in source ? source.naturalWidth : source.width;
    const height = "naturalHeight" in source ? source.naturalHeight : source.height;

    if (!width || !height) {
      return file;
    }

    const scale = Math.min(1, maxSide / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      return file;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, targetWidth, targetHeight);

    if ("close" in source) {
      source.close();
    }

    let blob = await toBlob(canvas, "image/webp", QUALITY);
    let extension = "webp";

    // Navegadores antiguos sin WebP: JPG solo si la foto original era JPG
    // (un PNG pasado a JPG perdería la transparencia)
    if (!blob || blob.type !== "image/webp") {
      if (file.type !== "image/jpeg") {
        return file;
      }

      blob = await toBlob(canvas, "image/jpeg", QUALITY);
      extension = "jpg";
    }

    if (!blob || (scale === 1 && blob.size >= file.size)) {
      return file;
    }

    return new File([blob], renameFile(file.name, extension), {
      type: blob.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn("No se pudo comprimir la imagen; se sube la original.", error);
    return file;
  }
}
