import type { Metadata } from "next";
import CategoryContent from "./CategoryContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://foodtalent.onrender.com";

async function getProfessionalsBySpecialty(specialty: string) {
  try {
    const resp = await fetch(
      `${API_URL}/api/professionals/search?q=${encodeURIComponent(specialty)}`,
      { next: { revalidate: 3600 } }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { especialidad: string } }): Promise<Metadata> {
  const specialty = decodeURIComponent(params.especialidad);
  return {
    title: `Consultores en ${specialty} | FoodTalent`,
    description: `Encuentra los mejores consultores e ingenieros de alimentos especializados en ${specialty} en Latinoamérica. Conecta con expertos verificados en FoodTalent.`,
    openGraph: {
      title: `Consultores en ${specialty} | FoodTalent`,
      description: `Expertos verificados en ${specialty}. Encuentra talento técnico para tu empresa.`,
    },
  };
}

export default async function CategoryPage({ params }: { params: { especialidad: string } }) {
  const specialty = decodeURIComponent(params.especialidad);
  const professionals = await getProfessionalsBySpecialty(specialty);

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
