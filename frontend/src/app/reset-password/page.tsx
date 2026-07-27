"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Loader2, ChefHat, CheckCircle, AlertCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Error al restablecer la contrasena");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center max-w-md w-full">
          <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Enlace invalido</h1>
          <p className="text-slate-400 text-sm mb-6">El enlace de recuperacion no es valido o esta incompleto.</p>
          <a href="/forgot-password" className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm">
            Solicitar nuevo enlace
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2.5 text-xl font-bold text-white mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            FoodTalent
          </a>
        </div>

        {done ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Contrasena actualizada</h1>
            <p className="text-slate-400 text-sm mb-6">Tu contrasena se ha restablecido correctamente.</p>
            <a href="/login" className="inline-flex items-center gap-2 py-3 px-6 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-sm">
              Iniciar sesion
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-5">
            <h1 className="text-xl font-bold text-white mb-1">Nueva contrasena</h1>
            <p className="text-sm text-slate-400 mb-2">Elige una contrasena nueva para tu cuenta.</p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nueva contrasena</label>
              <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                placeholder="Minimo 8 caracteres" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar contrasena</label>
              <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                placeholder="Repite la contrasena" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Actualizando...</> : "Restablecer contrasena"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
