"use client";

import {
  MapPin,
  Clock,
  CheckCircle,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Briefcase,
  DollarSign,
  ExternalLink,
  FlaskConical,
  Award,
} from "lucide-react";

export default function ProfileContent({
  profile,
  id,
}: {
  profile: any;
  id: string;
}) {
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Profesional no encontrado</p>
          <a href="/" className="text-emerald-400 hover:text-emerald-300 font-semibold text-sm">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2);

  const whatsappUrl = `https://wa.me/573152006387?text=Hola%20${encodeURIComponent(profile.name)},%20encontre%20tu%20perfil%20en%20FoodTalent%20y%20me%20gustaria%20contactarte.`;

  const researchProducts = profile.research_products || [];
  const lastExperience = profile.last_experience;
  const mainSpecialty = profile.specialties?.[0] || "industria alimentaria";

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 pb-16">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-20 h-20 rounded-2xl border-2 border-slate-800 object-cover mx-auto sm:mx-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto sm:mx-0 flex-shrink-0">
                <span className="text-2xl font-bold text-emerald-400">{initials}</span>
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {profile.name}
                </h1>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Consultor especializado en {mainSpecialty}
                {profile.location && ` — ${profile.location}`}
              </p>

              {profile.specialties && profile.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {profile.specialties.map((spec: string) => (
                    <a
                      key={spec}
                      href={`/buscar/${encodeURIComponent(spec.toLowerCase())}`}
                      className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-lg font-medium hover:bg-slate-700 hover:text-emerald-400 transition-colors"
                    >
                      {spec}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 sm:px-8 pb-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {profile.experience_years > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    Experiencia
                  </div>
                  <p className="text-white font-semibold">{profile.experience_years} anos</p>
                </div>
              )}

              {profile.location && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <MapPin className="w-4 h-4" />
                    Ubicacion
                  </div>
                  <p className="text-white font-semibold">{profile.location}</p>
                </div>
              )}

              {profile.hourly_rate && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <DollarSign className="w-4 h-4" />
                    Tarifa
                  </div>
                  <p className="text-white font-semibold">${profile.hourly_rate} <span className="text-slate-400 text-xs font-normal">USD/hr</span></p>
                </div>
              )}

              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                  <Briefcase className="w-4 h-4" />
                  Disponibilidad
                </div>
                <p className="text-white font-semibold">{profile.availability}</p>
              </div>
            </div>
          </div>

          {profile.summary && (
            <div className="px-6 sm:px-8 pb-6">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Experiencia</h2>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">{profile.summary}</p>
            </div>
          )}

          {researchProducts.length > 0 && (
            <div className="px-6 sm:px-8 pb-6">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                Productos de investigacion / desarrollo
              </h2>
              <div className="space-y-3">
                {researchProducts.map((product: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-800">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">{product.name}</p>
                      {product.url && <p className="text-slate-500 text-xs mt-1 truncate">{product.url}</p>}
                    </div>
                    {product.url && (
                      <a href={product.url} target="_blank" rel="noopener noreferrer" className="ml-3 p-2 text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {lastExperience && (lastExperience.client || lastExperience.description) && (
            <div className="px-6 sm:px-8 pb-6">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Ultima experiencia
              </h2>
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-800 space-y-3">
                {lastExperience.client && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Cliente</p>
                    <p className="text-white font-medium text-sm">{lastExperience.client}</p>
                  </div>
                )}
                {lastExperience.description && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Que hizo</p>
                    <p className="text-slate-400 text-sm leading-relaxed">{lastExperience.description}</p>
                  </div>
                )}
                {lastExperience.achievement && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Logro</p>
                    <p className="text-emerald-400 text-sm font-medium">{lastExperience.achievement}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="px-6 sm:px-8 pb-8">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 px-6 rounded-xl font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-all duration-200 active:scale-[0.98] text-sm"
            >
              <MessageCircle className="w-5 h-5" />
              Contactar por WhatsApp
            </a>
            <p className="text-slate-600 text-xs text-center mt-3">
              Te conectaremos directamente con el profesional
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
