import { MetadataRoute } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://foodtalent.onrender.com";
const baseUrl = "https://foodtalent-five.vercel.app";

async function getProfessionals() {
  try {
    const resp = await fetch(`${API_URL}/api/professionals?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const professionals = await getProfessionals();

  const profileEntries = professionals.map((prof: any) => ({
    url: `${baseUrl}/profile/${prof.id}`,
    lastModified: new Date(prof.updated_at || prof.created_at || Date.now()),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const specialtyMap = new Set<string>();
  professionals.forEach((p: any) => {
    (p.specialties || []).forEach((s: string) => {
      const slug = s.toLowerCase().replace(/\s+/g, "-");
      specialtyMap.add(slug);
    });
  });

  const categoryEntries = Array.from(specialtyMap).map((slug) => ({
    url: `${baseUrl}/buscar/${encodeURIComponent(slug)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terminos`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    ...profileEntries,
    ...categoryEntries,
  ];
}
