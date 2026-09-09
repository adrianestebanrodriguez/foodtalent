"use client";

import { useState, useEffect } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { downloadJson } from "@/lib/convexApi";
import { Download, ArrowLeft, Shield, Search, Users, KeyRound } from "lucide-react";

export default function AdminPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const myProfile = useQuery(
    api.professionals.myProfile,
    isAuthenticated ? {} : "skip",
  );
  const isSuperuser = myProfile?.isSuperuser === true;

  const [wantPros, setWantPros] = useState(false);
  const [wantLogs, setWantLogs] = useState(false);
  const professionals = useQuery(
    api.professionals.exportProfessionalsJson,
    isSuperuser && wantPros ? {} : "skip",
  );
  const searchLogs = useQuery(
    api.professionals.exportSearchLogs,
    isSuperuser && wantLogs ? {} : "skip",
  );
  const users = useQuery(
    api.professionals.listRegisteredUsers,
    isSuperuser ? {} : "skip",
  );
  const resetPassword = useMutation(api.professionals.resetProfessionalPassword);
  const [resettingEmail, setResettingEmail] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleResetPassword = async (email: string) => {
    const newPassword = window.prompt(
      `Ingresa la nueva contraseña (min. 8 caracteres) para:\n${email}`,
    );
    if (!newPassword) return;
    if (newPassword.length < 8) {
      setMessage({ type: "err", text: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    setResettingEmail(email);
    setMessage(null);
    try {
      await resetPassword({ email, newPassword });
      setMessage({ type: "ok", text: `Contraseña actualizada para ${email}.` });
    } catch (e: any) {
      setMessage({ type: "err", text: e?.message ?? "Error al resetear la contraseña." });
    } finally {
      setResettingEmail(null);
    }
  };

  useEffect(() => {
    if (professionals) {
      downloadJson(
        `foodtalent_professionals_${new Date().toISOString().slice(0, 10)}.json`,
        professionals,
      );
      setWantPros(false);
    }
  }, [professionals]);

  useEffect(() => {
    if (searchLogs) {
      downloadJson(
        `foodtalent_search_logs_${new Date().toISOString().slice(0, 10)}.json`,
        searchLogs,
      );
      setWantLogs(false);
    }
  }, [searchLogs]);

  if (isLoading || (isAuthenticated && myProfile === undefined)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Debes iniciar sesión para acceder aquí.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <a href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </a>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
            <p className="text-sm text-slate-400">Respaldo de datos</p>
          </div>
        </div>

        {/* Export professionals */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Exportar profesionales</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Descarga un archivo JSON con todos los profesionales registrados en la plataforma.
          </p>
          <button
            onClick={() => setWantPros(true)}
            disabled={wantPros || !isSuperuser}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {wantPros ? "Exportando..." : "Descargar backup JSON"}
          </button>
          {!isSuperuser && (
            <p className="text-xs text-amber-400 mt-3">Solo administradores pueden exportar datos.</p>
          )}
        </div>

        {/* Export search logs */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Exportar historial de búsquedas</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Descarga un archivo JSON con todas las búsquedas realizadas en la plataforma, incluyendo el desafío, fecha, hora y resultados.
          </p>
          <button
            onClick={() => setWantLogs(true)}
            disabled={wantLogs || !isSuperuser}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            {wantLogs ? "Exportando..." : "Descargar historial JSON"}
          </button>
          {!isSuperuser && (
            <p className="text-xs text-amber-400 mt-3">Solo administradores pueden exportar datos.</p>
          )}
        </div>

        {/* Registered users */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Usuarios registrados</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Lista de cuentas registradas en la plataforma. Puedes restablecer la contraseña de
            cualquier profesional (el sistema guarda las contraseñas cifradas, por eso se resetean
            en vez de mostrarse). Si el profesional no tiene cuenta aun, esta se crea al asignar la clave.
          </p>
          {message && (
            <div
              className={
                "px-4 py-3 rounded-xl text-sm mb-4 " +
                (message.type === "ok"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400")
              }
            >
              {message.text}
            </div>
          )}
          {users === undefined ? (
            <p className="text-slate-500 text-sm">Cargando...</p>
          ) : users.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay usuarios registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-800">
                    <th className="py-2 pr-4 font-medium">Nombre</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Rol</th>
                    <th className="py-2 pr-4 font-medium">Cuenta</th>
                    <th className="py-2 pr-4 font-medium">Estado</th>
                    <th className="py-2 font-medium">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.userId ?? u.email} className="border-b border-slate-800/60">
                      <td className="py-3 pr-4 text-white">{u.fullName ?? "-"}</td>
                      <td className="py-3 pr-4 text-slate-300">{u.email ?? "-"}</td>
                      <td className="py-3 pr-4 text-slate-400">{u.role}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            "px-2 py-0.5 rounded-full text-xs " +
                            (u.hasAccount
                              ? "bg-slate-500/10 text-slate-300"
                              : "bg-amber-500/10 text-amber-400")
                          }
                        >
                          {u.hasAccount ? "Con cuenta" : "Sin cuenta"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={
                            "px-2 py-0.5 rounded-full text-xs " +
                            (u.isActive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400")
                          }
                        >
                          {u.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="py-3">
                        {u.role === "admin" && u.isSuperuser ? (
                          <span className="text-slate-600 text-xs">(admin)</span>
                        ) : (
                          <button
                            onClick={() => handleResetPassword(u.email)}
                            disabled={resettingEmail === u.email || !u.email}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            {resettingEmail === u.email
                              ? "Procesando..."
                              : u.hasAccount
                              ? "Resetear clave"
                              : "Crear acceso"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
