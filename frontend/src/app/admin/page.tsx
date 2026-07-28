"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/api";
import { ChefHat, Download, ArrowLeft, Shield } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    try {
      const resp = await fetch("/api/professionals/export/json", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        alert(err.detail || "Error al exportar");
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foodtalent_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al descargar el archivo");
    } finally {
      setExporting(false);
    }
  };

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

        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Exportar profesionales</h2>
          </div>
          <p className="text-sm text-slate-400 mb-6">
            Descarga un archivo JSON con todos los profesionales registrados en la plataforma. Útil como respaldo en caso de caída de la base de datos.
          </p>
          <button
            onClick={handleExport}
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
      </div>
    </div>
  );
}
