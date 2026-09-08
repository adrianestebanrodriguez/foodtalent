"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2, ChefHat, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signIn("password", { email, flow: "reset" });
      setSent(true);
    } catch (err: any) {
      setError("No pudimos enviar el codigo. Verifica el email e intenta de nuevo.");
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
        </div>

        {sent ? (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center space-y-6">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <Mail className="w-7 h-7 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Revisa tu email</h1>
            <p className="text-slate-400 text-sm">
              Te enviamos un codigo de verificacion. Ingresalo junto con tu nueva
              contrasena en la siguiente pantalla.
            </p>
            <a
              href={`/reset-password?email=${encodeURIComponent(email)}`}
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors text-sm"
            >
              Ingresar codigo
            </a>

            <div className="pt-4 border-t border-slate-800">
              <a href="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm">
                Volver al inicio de sesion
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 space-y-5">
            <h1 className="text-xl font-bold text-white mb-1">Recuperar contrasena</h1>
            <p className="text-sm text-slate-400 mb-2">
              Te enviaremos un enlace para crear una nueva contrasena.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Correo electronico</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-800 focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm text-white placeholder:text-slate-500"
                placeholder="tu@email.com" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar enlace"}
            </button>

            <p className="text-center text-sm text-slate-500">
              <a href="/login" className="text-slate-400 hover:text-emerald-400 font-semibold inline-flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Volver al inicio de sesion
              </a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
