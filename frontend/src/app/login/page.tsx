"use client";

import { useState } from "react";
import { loginAndStore } from "@/lib/api";
import { Loader2, ChefHat, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await loginAndStore(email, password);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-white mb-2">Iniciar sesion</h1>
          <p className="text-slate-400 text-sm">Accede a tu cuenta de experto</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Correo electronico</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
              placeholder="tu@email.com" />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">Contrasena</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
              placeholder="*******" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</> : <>Iniciar sesion <ArrowRight className="w-4 h-4" /></>}
          </button>

          <p className="text-center text-sm">
            <a href="/forgot-password" className="text-slate-400 hover:text-emerald-400 font-semibold">Olvide mi contrasena</a>
          </p>

          <p className="text-center text-sm text-slate-500">
            No tienes cuenta?{" "}
            <a href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold">Registrarse</a>
          </p>
        </form>
      </div>
    </div>
  );
}
