import { mutation } from "./_generated/server";
import { v } from "convex/values";

// One-shot import of a professional together with its pre-computed embedding
// (from the PostgreSQL backup), linking professionalEmbeddings.embeddingId.
export const importProfessionalWithEmbedding = mutation({
  args: {
    professional: v.object({
      name: v.string(),
      email: v.optional(v.string()),
      avatarUrl: v.optional(v.string()),
      whatsapp: v.optional(v.string()),
      specialties: v.array(v.string()),
      experienceYears: v.number(),
      availability: v.string(),
      hourlyRate: v.optional(v.string()),
      location: v.optional(v.string()),
      researchProducts: v.array(
        v.object({ name: v.string(), url: v.optional(v.string()) }),
      ),
      lastExperience: v.optional(
        v.object({
          client: v.optional(v.string()),
          description: v.optional(v.string()),
          achievement: v.optional(v.string()),
        }),
      ),
      summary: v.string(),
      markdownContent: v.string(),
      source: v.string(),
      sources: v.array(v.string()),
      isVerified: v.boolean(),
      rating: v.number(),
      projectsCompleted: v.number(),
    }),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const { professional, embedding } = args;
    const id = await ctx.db.insert("professionals", {
      ...professional,
      userId: undefined,
    });
    const embeddingId = await ctx.db.insert("professionalEmbeddings", {
      professionalId: id,
      embedding,
    });
    await ctx.db.patch(id, { embeddingId });
    return await ctx.db.get(id);
  },
});

// Link an already-imported professional to its embedding doc.
export const linkEmbedding = mutation({
  args: {
    professionalId: v.id("professionals"),
    embeddingId: v.id("professionalEmbeddings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.professionalId, { embeddingId: args.embeddingId });
    return await ctx.db.get(args.professionalId);
  },
});