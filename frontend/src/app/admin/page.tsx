"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/api";
import { Download, ArrowLeft, Shield, Search } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingLogs, setExportingLogs] = useState(false);

  useEffect(() => {
    const t = getAuthToken();
    setToken(t);
    if (t) {
      try {
        const payload = JSON.parse(atob(t.split(".")[1]));
        setIsSuperuser(payload.is_superuser === true);
      } catch {}
    }
  }, []);

  const downloadFile = async (url: string, filename: string, setLoading: (v: boolean) => void) => {
    if (!token) return;
    setLoading(true);
    try {
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        alert(err.detail || "Error al exportar");
        return;
      }
      const blob = await resp.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert("Error al descargar el archivo");
    } finally {
      setLoading(false);
    }
  };

  const handleExportProfessionals = () =>
    downloadFile(
      "/api/professionals/export/json",
      `foodtalent_professionals_${new Date().toISOString().slice(0, 10)}.json`,
      setExporting
    );

  const handleExportSearchLogs = () =>
    downloadFile(
      "/api/search/export/json",
      `foodtalent_search_logs_${new Date().toISOString().slice(0, 10)}.json`,
      setExportingLogs
    );

  if (!token) {
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
            onClick={handleExportProfessionals}
            disabled={exporting || !isSuperuser}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exportando..." : "Descargar backup JSON"}
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
            onClick={handleExportSearchLogs}
            disabled={exportingLogs || !isSuperuser}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            {exportingLogs ? "Exportando..." : "Descargar historial JSON"}
          </button>
          {!isSuperuser && (
            <p className="text-xs text-amber-400 mt-3">Solo administradores pueden exportar datos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
