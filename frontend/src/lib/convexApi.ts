// Maps Convex documents (camelCase) to the snake_case shape the UI uses.
// Lets the existing components work unchanged against Convex data.

export interface UIProfessional {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  specialties: string[];
  experience_years: number;
  availability: string;
  hourly_rate: string | null;
  location: string | null;
  summary: string;
  markdown_content: string;
  source: string;
  sources: string[];
  is_verified: boolean;
  rating: number;
  projects_completed: number;
  research_products: { name: string; url?: string }[];
  last_experience: {
    client?: string;
    description?: string;
    achievement?: string;
  } | null;
  created_at: string | null;
}

export function toUIProfessional(doc: any): UIProfessional | null {
  if (!doc) return null;
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email ?? null,
    avatar_url: doc.avatarUrl ?? null,
    whatsapp: doc.whatsapp ?? null,
    specialties: doc.specialties ?? [],
    experience_years: doc.experienceYears ?? 0,
    availability: doc.availability ?? "inmediata",
    hourly_rate: doc.hourlyRate ?? null,
    location: doc.location ?? null,
    summary: doc.summary ?? "",
    markdown_content: doc.markdownContent ?? "",
    source: doc.source,
    sources: doc.sources ?? [],
    is_verified: doc.isVerified ?? false,
    rating: doc.rating ?? 0,
    projects_completed: doc.projectsCompleted ?? 0,
    research_products: (doc.researchProducts ?? []).map((p: any) =>
      typeof p === "string" ? { name: p } : { name: p.name ?? "", url: p.url },
    ),
    last_experience: doc.lastExperience ?? null,
    created_at: doc._creationTime
      ? new Date(doc._creationTime).toISOString()
      : null,
  };
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
