"use client";

import { supabase } from "@/lib/supabase";
import { AlertCircle, Lock, LogIn, Mail } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "rca.importperu@gmail.com",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!form.email.trim() || !form.password.trim()) {
      setErrorMessage("Ingresa el correo y la contraseña.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    setLoading(false);

    if (error || !data.session) {
      setErrorMessage("Correo o contraseña incorrectos.");
      return;
    }

    if (form.email.trim().toLowerCase() !== "rca.importperu@gmail.com") {
      await supabase.auth.signOut();
      setErrorMessage("Este usuario no tiene permisos de administrador.");
      return;
    }

    localStorage.setItem(
      "rca_import_admin_session",
      JSON.stringify({
        email: form.email.trim(),
        loggedAt: new Date().toISOString(),
      })
    );

    router.push("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-6 py-10 text-slate-950">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[3rem] bg-white shadow-2xl shadow-slate-200 lg:grid-cols-[0.9fr_1fr]">
        <aside className="bg-slate-950 p-8 text-white md:p-10">
          <div className="relative h-20 w-20 overflow-hidden rounded-[2rem] bg-white shadow-sm">
            <Image
              src="/logo-rca.png"
              alt="Logo RCA IMPORT"
              fill
              className="object-contain p-2"
              priority
            />
          </div>

          <p className="mt-8 text-sm font-black uppercase tracking-[0.25em] text-blue-300">
            Panel administrador
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
            Acceso seguro para RCA IMPORT.
          </h1>

          <p className="mt-5 text-sm font-semibold leading-7 text-slate-300">
            Inicia sesión con el usuario creado en Supabase para administrar
            productos, reservas, pagos, banners y configuración.
          </p>
        </aside>

        <form onSubmit={handleSubmit} className="p-8 md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#E31B23]">
            Iniciar sesión
          </p>

          <h2 className="mt-3 text-4xl font-black">Admin RCA</h2>

          {errorMessage && (
            <div className="mt-6 flex gap-3 rounded-2xl bg-red-50 p-4 text-sm font-bold text-[#E31B23]">
              <AlertCircle className="shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="mt-7 grid gap-4">
            <div>
  <label className="text-sm font-black text-slate-700">
    Correo administrador
  </label>

  <div className="mt-2 flex h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-5 transition focus-within:border-[#0057A8] focus-within:bg-white">
    <Mail className="shrink-0 text-slate-400" size={22} />

    <input
      value={form.email}
      onChange={(event) =>
        setForm({ ...form, email: event.target.value })
      }
      className="h-full w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
      placeholder="rca.importperu@gmail.com"
    />
  </div>
</div>
            <div>
  <label className="text-sm font-black text-slate-700">
    Contraseña
  </label>

  <div className="mt-2 flex h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-[#f6f8fc] px-5 transition focus-within:border-[#0057A8] focus-within:bg-white">
    <Lock className="shrink-0 text-slate-400" size={22} />

    <input
      value={form.password}
      onChange={(event) =>
        setForm({ ...form, password: event.target.value })
      }
      type="password"
      className="h-full w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
      placeholder="Contraseña de Supabase"
    />
  </div>
</div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0057A8] px-6 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={18} />
            {loading ? "Ingresando..." : "Entrar al panel"}
          </button>

          <p className="mt-5 text-center text-xs font-semibold leading-6 text-slate-500">
            Este login ya usa Supabase Auth. Más adelante quitaremos por completo
            las validaciones antiguas de localStorage.
          </p>
        </form>
      </section>
    </main>
  );
}