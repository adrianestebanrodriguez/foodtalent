"use client";

import { ArrowLeft, MapPin, Clock, ExternalLink } from "lucide-react";

export default function CategoryContent({
  specialty,
  professionals,
}: {
  specialty: string;
  professionals: any[];
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <a href="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 pb-16">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          Consultores en {specialty}
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          {professionals.length} profesional(es) encontrado(s) especializado(s) en {specialty}
        </p>

        {professionals.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500">No hay profesionales registrados en esta especialidad aun.</p>
            <a
              href="/register"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            >
              Publica tu perfil
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {professionals.map((prof: any) => (
              <a
                key={prof.id}
                href={`/profile/${prof.id}`}
                className="block bg-slate-900 rounded-xl border border-slate-800 p-5 hover:border-emerald-600/50 transition-all hover:shadow-lg hover:shadow-emerald-900/10"
              >
                <h2 className="text-white font-semibold text-base mb-2">{prof.name}</h2>
                {prof.specialties && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {prof.specialties.slice(0, 3).map((s: string) => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {prof.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {prof.location}
                    </span>
                  )}
                  {prof.experience_years > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {prof.experience_years} anos
                    </span>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
