"use client";

import { MapPin, Clock, CheckCircle, ArrowUpRight, Play, ExternalLink } from "lucide-react";

interface ResultCardProps {
  result: {
    professional_id: number;
    name: string;
    match_percentage: number;
    nivel_match?: string;
    explanation: string;
    source: string;
    avatar_url: string | null;
    specialties: string[];
    experience_years: number;
    location: string | null;
  };
}

function MatchBadge({ percentage, nivel_match }: { percentage: number; nivel_match?: string }) {
  const label = nivel_match || (
    percentage >= 80 ? "Alto" : percentage >= 60 ? "Relevante" : "Match"
  );

  return (
    <div className="flex items-center gap-2">
      <div className="w-full max-w-[120px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 80 ? "bg-emerald-500" : percentage >= 60 ? "bg-amber-500" : "bg-slate-300"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
        {percentage}% {label}
      </span>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    registered: {
      label: "Verificado",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <CheckCircle className="w-3 h-3" />,
    },
    youtube: {
      label: "YouTube",
      color: "bg-red-50 text-red-700 border-red-200",
      icon: <Play className="w-3 h-3" />,
    },
    web: {
      label: "Web",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <ExternalLink className="w-3 h-3" />,
    },
  };

  const badge = config[source] || config.registered;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${badge.color}`}
    >
      {badge.icon}
      {badge.label}
    </span>
  );
}

export function ResultCard({ result }: ResultCardProps) {
  const initials = result.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <article
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-slate-300 hover:-translate-y-0.5"
      aria-labelledby={`result-name-${result.professional_id}`}
    >
      {/* Header */}
      <div className="relative h-20 bg-gradient-to-r from-slate-800 to-slate-900">
        <div className="absolute -bottom-6 left-5">
          {result.avatar_url ? (
            <img
              src={result.avatar_url}
              alt=""
              className="w-14 h-14 rounded-xl border-2 border-white object-cover shadow-md"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-xl border-2 border-white bg-emerald-100 flex items-center justify-center shadow-md"
              aria-hidden="true"
            >
              <span className="text-lg font-bold text-emerald-700">{initials}</span>
            </div>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <SourceBadge source={result.source} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 pt-9">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            id={`result-name-${result.professional_id}`}
            className="text-base font-semibold text-slate-900 leading-tight"
          >
            {result.name}
          </h3>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
          {result.experience_years > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {result.experience_years} anos
            </span>
          )}
          {result.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {result.location}
            </span>
          )}
        </div>

        {/* Match */}
        <div className="mb-3">
          <MatchBadge percentage={result.match_percentage} nivel_match={result.nivel_match} />
        </div>

        {/* Specialties */}
        {result.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {result.specialties.slice(0, 3).map((spec) => (
              <span
                key={spec}
                className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md font-medium"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Explanation */}
        <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">
          {result.explanation}
        </p>

        {/* CTA */}
        <a
          href={`/profile/${result.professional_id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 active:scale-[0.98]"
          aria-label={`Ver perfil de ${result.name}`}
        >
          Ver perfil
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </article>
  );
}
