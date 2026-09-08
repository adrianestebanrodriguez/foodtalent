"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { toUIProfessional } from "@/lib/convexApi";
import ProfileContent from "./ProfileContent";
import { Loader2 } from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const professionalId = params.id as Id<"professionals">;
  const doc = useQuery(api.professionals.getProfessional, { professionalId });

  if (doc === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const profile = toUIProfessional(doc);
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400">Perfil no encontrado.</p>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: `Consultor en ${profile.specialties?.[0] || "industria alimentaria"}`,
    knowsAbout: profile.specialties || [],
    worksLocation: profile.location || "Latinoamérica",
    url: `https://foodtalent-five.vercel.app/profile/${params.id}`,
    affiliation: {
      "@id": "https://foodtalent-five.vercel.app/#organization",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProfileContent profile={profile} id={params.id as string} />
    </>
  );
}
