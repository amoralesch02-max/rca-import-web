"use client";

import { AlertTriangle, X } from "lucide-react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-950/30">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div className="flex gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                danger ? "bg-red-50" : "bg-blue-50"
              }`}
            >
              <AlertTriangle
                className={danger ? "text-[#E31B23]" : "text-[#0057A8]"}
                size={26}
              />
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-950">{title}</h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-3 p-6 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-14 rounded-2xl bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-14 rounded-2xl px-5 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              danger
                ? "bg-[#E31B23] hover:bg-red-700"
                : "bg-[#0057A8] hover:bg-blue-700"
            }`}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}