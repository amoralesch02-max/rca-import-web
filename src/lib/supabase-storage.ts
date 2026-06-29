import { supabase } from "@/lib/supabase";

const STORAGE_BUCKET = "rca-images";

function cleanFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9.]/g, "-")
    .replace(/-+/g, "-");
}

export async function uploadImageFile(file: File, folder = "general") {
  if (!file.type.startsWith("image/")) {
    return {
      success: false,
      url: "",
      path: "",
      error: "El archivo debe ser una imagen.",
    };
  }

  const maxSize = 10 * 1024 * 1024;

  if (file.size > maxSize) {
    return {
      success: false,
      url: "",
      path: "",
      error: "La imagen no debe superar los 10 MB.",
    };
  }

  const cleanName = cleanFileName(file.name);
  const uniqueName = `${folder}/${Date.now()}-${crypto.randomUUID()}-${cleanName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(uniqueName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error subiendo imagen:", error.message);

    return {
      success: false,
      url: "",
      path: "",
      error: error.message,
    };
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(uniqueName);

  return {
    success: true,
    url: data.publicUrl,
    path: uniqueName,
    error: null,
  };
}

export async function uploadVideoFile(file: File, folder = "videos") {
  const allowedTypes = ["video/mp4", "video/webm", "video/quicktime"];

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      url: "",
      path: "",
      error: "El video debe ser MP4, WEBM o MOV.",
    };
  }

  const maxSize = 30 * 1024 * 1024;

  if (file.size > maxSize) {
    return {
      success: false,
      url: "",
      path: "",
      error: "El video no debe superar los 30 MB.",
    };
  }

  const cleanName = cleanFileName(file.name);
  const uniqueName = `${folder}/${Date.now()}-${crypto.randomUUID()}-${cleanName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(uniqueName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error subiendo video:", error.message);

    return {
      success: false,
      url: "",
      path: "",
      error: error.message,
    };
  }

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(uniqueName);

  return {
    success: true,
    url: data.publicUrl,
    path: uniqueName,
    error: null,
  };
}
const PAYMENT_PROOF_BUCKET = "rca-payment-proofs";

export async function uploadPaymentProofFile(file: File) {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      path: "",
      fileName: "",
      error: "El comprobante debe ser una imagen PNG, JPG, JPEG o WEBP.",
    };
  }

  const maxSize = 5 * 1024 * 1024;

  if (file.size > maxSize) {
    return {
      success: false,
      path: "",
      fileName: "",
      error: "El comprobante no debe superar los 5 MB.",
    };
  }

  const cleanName = cleanFileName(file.name);
  const uniqueName = `pagos/${Date.now()}-${crypto.randomUUID()}-${cleanName}`;

  const { error } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .upload(uniqueName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error subiendo comprobante:", error.message);

    return {
      success: false,
      path: "",
      fileName: "",
      error: error.message,
    };
  }

  return {
    success: true,
    path: uniqueName,
    fileName: file.name,
    error: null,
  };
}

export async function createPaymentProofSignedUrl(path: string) {
  if (!path) {
    return {
      success: false,
      url: "",
      error: "No hay comprobante registrado.",
    };
  }

  const { data, error } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .createSignedUrl(path, 60 * 10);

  if (error) {
    console.error("Error creando enlace del comprobante:", error.message);

    return {
      success: false,
      url: "",
      error: error.message,
    };
  }

  return {
    success: true,
    url: data.signedUrl,
    error: null,
  };
}