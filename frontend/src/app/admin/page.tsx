"use client";

import { useState, useEffect } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { downloadJson } from "@/lib/convexApi";
import { Download, ArrowLeft, Shield, Search } from "lucide-react";

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
      </div>
    </div>
  );
}
