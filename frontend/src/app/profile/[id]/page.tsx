import type { Metadata } from "next";
import ProfileContent from "./ProfileContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://foodtalent.onrender.com";

async function getProfile(id: string) {
  try {
    const resp = await fetch(`${API_URL}/api/professionals/${id}`, { next: { revalidate: 3600 } });
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const profile = await getProfile(params.id);
  if (!profile) {
    return { title: "Perfil no encontrado | FoodTalent" };
  }

  const mainSpecialty = profile.specialties?.[0] || "industria alimentaria";
  const location = profile.location || "Latinoamérica";

  return {
    title: `${profile.name} — Consultor en ${mainSpecialty} | FoodTalent`,
    description: `${profile.name} es especialista en ${mainSpecialty} con ${profile.experience_years} años de experiencia en ${location}. Conecta con ${profile.name} en FoodTalent para resolver retos de ${mainSpecialty}.`,
    openGraph: {
      title: `${profile.name} — Consultor en ${mainSpecialty}`,
      description: `${profile.experience_years} años de experiencia. Especialista en ${mainSpecialty}.`,
      type: "profile",
    },
  };
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const profile = await getProfile(params.id);

  const jsonLd = profile
    ? {
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
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProfileContent profile={profile} id={params.id} />
    </>
  );
}
