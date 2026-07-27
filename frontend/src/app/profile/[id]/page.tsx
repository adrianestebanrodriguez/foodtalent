"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProfessionalProfile } from "@/lib/api";
import {
  MapPin,
  Clock,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Pencil,
  MessageCircle,
  Briefcase,
  DollarSign,
  ExternalLink,
  FlaskConical,
  Award,
} from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.id) {
      getProfessionalProfile(Number(params.id))
        .then(setProfile)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
        <div className="text-center">
          <p className="text-slate-400 mb-4">
            {error || "Profesional no encontrado"}
          </p>
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

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
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
          {/* Avatar + Name */}
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-20 h-20 rounded-2xl border-2 border-slate-800 object-cover mx-auto sm:mx-0"
              />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto sm:mx-0 flex-shrink-0"
              >
                <span className="text-2xl font-bold text-emerald-400">
                  {initials}
                </span>
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {profile.name}
                </h1>
                {profile.source === "registered" && profile.is_verified && (
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-sm font-semibold justify-center sm:justify-start">
                    <CheckCircle className="w-4 h-4" />
                    Verificado
                  </span>
                )}
              </div>

              {/* Specialties */}
              {profile.specialties && profile.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {profile.specialties.map((spec: string) => (
                    <span
                      key={spec}
                      className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-lg font-medium"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex sm:flex-col gap-2 sm:ml-auto">
              <a
                href={`/profile/${params.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </a>
            </div>
          </div>

          {/* Info Cards */}
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

          {/* Summary */}
          {profile.summary && (
            <div className="px-6 sm:px-8 pb-6">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
                Experiencia
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-line">
                {profile.summary}
              </p>
            </div>
          )}

          {/* Research Products */}
          {researchProducts.length > 0 && (
            <div className="px-6 sm:px-8 pb-6">
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-400" />
                Productos de investigacion / desarrollo
              </h2>
              <div className="space-y-3">
                {researchProducts.map((product: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {product.name}
                      </p>
                      {product.url && (
                        <p className="text-slate-500 text-xs mt-1 truncate">
                          {product.url}
                        </p>
                      )}
                    </div>
                    {product.url && (
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 p-2 text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Experience */}
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

          {/* CTA */}
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
