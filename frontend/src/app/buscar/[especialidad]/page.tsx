"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toUIProfessional } from "@/lib/convexApi";
import CategoryContent from "./CategoryContent";
import { Loader2 } from "lucide-react";

export default function CategoryPage() {
  const params = useParams();
  const specialty = decodeURIComponent(params.especialidad as string);
  const docs = useQuery(api.professionals.listProfessionals, {
    skip: 0,
    limit: 100,
  });

  if (docs === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const professionals = docs
    .map(toUIProfessional)
    .filter(
      (p): p is NonNullable<typeof p> =>
        !!p && (p.specialties ?? []).includes(specialty),
    );

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Consultores en ${specialty}`,
    description: `Directorio de consultores e ingenieros de alimentos especializados en ${specialty}.`,
    url: `https://foodtalent-five.vercel.app/buscar/${params.especialidad}`,
    isPartOf: { "@id": "https://foodtalent-five.vercel.app/#website" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CategoryContent specialty={specialty} professionals={professionals} />
    </>
  );
}
