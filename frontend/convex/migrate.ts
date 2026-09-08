import { internalMutation } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

// One-shot import of the FastAPI export (GET /api/professionals/export/json).
// Accepts both the FastAPI snake_case shape and camelCase.
export const importProfessionals = internalMutation({
  args: { items: v.array(v.any()) },
  handler: async (ctx, args) => {
    let count = 0;
    for (const raw of args.items as any[]) {
      const id = await ctx.db.insert("professionals", {
        name: raw.name,
        email: raw.email ?? undefined,
        avatarUrl: raw.avatarUrl ?? raw.avatar_url ?? undefined,
        whatsapp: raw.whatsapp ?? undefined,
        specialties: raw.specialties ?? [],
        experienceYears: raw.experienceYears ?? raw.experience_years ?? 0,
        availability: raw.availability ?? "inmediata",
        hourlyRate: raw.hourlyRate ?? raw.hourly_rate ?? undefined,
        location: raw.location ?? undefined,
        researchProducts: (
          raw.researchProducts ??
          raw.research_products ??
          []
        ).map((p: any) =>
          typeof p === "string" ? { name: p } : { name: p.name ?? "", url: p.url },
        ),
        lastExperience: raw.lastExperience ?? raw.last_experience ?? undefined,
        summary: raw.summary ?? "",
        markdownContent: raw.markdownContent ?? raw.markdown_content ?? "",
        source: raw.source ?? "registered",
        sources: raw.sources ?? [raw.source ?? "registered"],
        isVerified: raw.isVerified ?? raw.is_verified ?? false,
        rating: raw.rating ?? 0,
        projectsCompleted:
          raw.projectsCompleted ?? raw.projects_completed ?? 0,
      });
      await ctx.scheduler.runAfter(
        0,
        api.professionals.embedProfessional,
        { professionalId: id },
      );
      count++;
    }
    return { imported: count };
  },
});
