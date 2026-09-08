import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const researchProduct = v.object({
  name: v.string(),
  url: v.optional(v.string()),
});

const lastExperience = v.object({
  client: v.optional(v.string()),
  description: v.optional(v.string()),
  achievement: v.optional(v.string()),
});

export default defineSchema({
  ...authTables,

  // App profile linked to Convex Auth user. Roles: "profesional" | "empresa" | "admin".
  profiles: defineTable({
    userId: v.id("users"),
    role: v.string(),
    fullName: v.optional(v.string()),
    isActive: v.boolean(),
    isSuperuser: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  professionals: defineTable({
    userId: v.optional(v.id("users")),
    name: v.string(),
    email: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    specialties: v.array(v.string()),
    experienceYears: v.number(),
    availability: v.string(),
    hourlyRate: v.optional(v.string()),
    location: v.optional(v.string()),
    researchProducts: v.array(researchProduct),
    lastExperience: v.optional(lastExperience),
    summary: v.string(),
    markdownContent: v.string(),
    markdownFileId: v.optional(v.id("_storage")),
    source: v.string(), // registered | youtube | web
    sources: v.array(v.string()),
    embeddingId: v.optional(v.id("professionalEmbeddings")),
    isVerified: v.boolean(),
    rating: v.number(),
    projectsCompleted: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_source", ["source"]),

  // Embeddings live in their own table so reads of professionals
  // don't load 768 floats every time (Convex best practice).
  professionalEmbeddings: defineTable({
    professionalId: v.id("professionals"),
    embedding: v.array(v.float64()),
  })
    .index("by_professional", ["professionalId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768, // gemini-embedding-001 with outputDimensionality=768
    }),

  searchLogs: defineTable({
    query: v.string(),
    resultsCount: v.number(),
    topMatchName: v.optional(v.string()),
    topMatchPercentage: v.optional(v.number()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  }),
});
